/* ------------------------------- CSV -------------------------------- */

export function detectDelimiter(text: string): ',' | ';' | '\t' | '|' {
  const sample = text.split(/\r?\n/).slice(0, 10).join('\n');
  const cands: (',' | ';' | '\t' | '|')[] = [',', ';', '\t', '|'];
  let best: ',' | ';' | '\t' | '|' = ',';
  let bestScore = -1;
  for (const d of cands) {
    const counts = sample
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split(d).length - 1);
    if (!counts.length) continue;
    const consistent = counts.every((c) => c === counts[0]) ? 2 : 1;
    const score = counts[0] * consistent;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/** RFC 4180 CSV parser: quoted fields, escaped quotes, embedded delimiters and newlines. */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, '');
  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"' && field === '') {
      inQuotes = true;
      i++;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
      i++;
    } else if (c === '\r' || c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += c === '\r' && s[i + 1] === '\n' ? 2 : 1;
    } else {
      field += c;
      i++;
    }
  }
  if (inQuotes) throw new Error('Unterminated quoted field — a closing double quote is missing.');
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function typed(v: string): unknown {
  const t = v.trim();
  if (t === '') return '';
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(t) && Number.isFinite(Number(t)) && (t.length < 16 || t.includes('.'))) return Number(t);
  return v;
}

export function csvToJson(
  text: string,
  opts: { delimiter?: string; header: boolean; parseTypes: boolean; skipEmpty?: boolean },
): unknown[] {
  const delimiter = opts.delimiter || detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  if (!rows.length) return [];
  const conv = (v: string) => (opts.parseTypes ? typed(v) : v);
  if (!opts.header) return rows.map((r) => r.map(conv));
  const seen = new Map<string, number>();
  const headers = rows[0].map((h, idx) => {
    const base = h.trim() || `column_${idx + 1}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n > 1 ? `${base}_${n}` : base;
  });
  return rows.slice(1).map((r) => {
    const o: Record<string, unknown> = {};
    headers.forEach((h, idx) => (o[h] = conv(r[idx] ?? '')));
    return o;
  });
}

export function flatten(obj: unknown, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (!entries.length && prefix) out[prefix] = '';
    for (const [k, v] of entries) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (Array.isArray(obj)) {
    out[prefix || 'value'] = JSON.stringify(obj);
  } else {
    out[prefix || 'value'] = obj;
  }
  return out;
}

export function jsonToCsv(
  json: unknown,
  opts: { delimiter: string; protectFormulas: boolean; bom: boolean; eol?: '\n' | '\r\n' },
): string {
  const arr = Array.isArray(json) ? json : [json];
  if (!arr.length) return '';
  const rows = arr.map((x) => flatten(x));
  const cols: string[] = [];
  const seen = new Set<string>();
  for (const r of rows)
    for (const k of Object.keys(r))
      if (!seen.has(k)) {
        seen.add(k);
        cols.push(k);
      }
  const esc = (v: unknown) => {
    let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (opts.protectFormulas && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /["\r\n]/.test(s) || s.includes(opts.delimiter) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const eol = opts.eol ?? '\r\n';
  const lines = [cols.map(esc).join(opts.delimiter), ...rows.map((r) => cols.map((c) => esc(r[c])).join(opts.delimiter))];
  return (opts.bom ? '\uFEFF' : '') + lines.join(eol);
}

/* ------------------------------ Units ------------------------------- */

export interface UnitDef {
  id: string;
  label: string;
  factor: number; // to base unit
}

export const UNIT_CATEGORIES: Record<string, { label: string; units: UnitDef[] }> = {
  length: {
    label: 'Length',
    units: [
      { id: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
      { id: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
      { id: 'm', label: 'Meter (m)', factor: 1 },
      { id: 'km', label: 'Kilometer (km)', factor: 1000 },
      { id: 'in', label: 'Inch (in)', factor: 0.0254 },
      { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
      { id: 'yd', label: 'Yard (yd)', factor: 0.9144 },
      { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
      { id: 'nmi', label: 'Nautical mile', factor: 1852 },
    ],
  },
  weight: {
    label: 'Weight / mass',
    units: [
      { id: 'mg', label: 'Milligram (mg)', factor: 1e-6 },
      { id: 'g', label: 'Gram (g)', factor: 0.001 },
      { id: 'kg', label: 'Kilogram (kg)', factor: 1 },
      { id: 't', label: 'Metric ton (t)', factor: 1000 },
      { id: 'oz', label: 'Ounce (oz)', factor: 0.028349523125 },
      { id: 'lb', label: 'Pound (lb)', factor: 0.45359237 },
      { id: 'st', label: 'Stone (st)', factor: 6.35029318 },
    ],
  },
  volume: {
    label: 'Volume',
    units: [
      { id: 'ml', label: 'Milliliter (ml)', factor: 0.001 },
      { id: 'l', label: 'Liter (l)', factor: 1 },
      { id: 'm3', label: 'Cubic meter (m³)', factor: 1000 },
      { id: 'tsp', label: 'Teaspoon (US)', factor: 0.00492892159375 },
      { id: 'tbsp', label: 'Tablespoon (US)', factor: 0.01478676478125 },
      { id: 'floz', label: 'Fluid ounce (US)', factor: 0.0295735295625 },
      { id: 'cup', label: 'Cup (US)', factor: 0.2365882365 },
      { id: 'gal', label: 'Gallon (US)', factor: 3.785411784 },
      { id: 'galuk', label: 'Gallon (UK)', factor: 4.54609 },
    ],
  },
  area: {
    label: 'Area',
    units: [
      { id: 'cm2', label: 'Square centimeter', factor: 1e-4 },
      { id: 'm2', label: 'Square meter (m²)', factor: 1 },
      { id: 'ha', label: 'Hectare (ha)', factor: 10000 },
      { id: 'km2', label: 'Square kilometer', factor: 1e6 },
      { id: 'in2', label: 'Square inch', factor: 0.00064516 },
      { id: 'ft2', label: 'Square foot', factor: 0.09290304 },
      { id: 'ac', label: 'Acre', factor: 4046.8564224 },
      { id: 'mi2', label: 'Square mile', factor: 2589988.110336 },
    ],
  },
  speed: {
    label: 'Speed',
    units: [
      { id: 'ms', label: 'Meters per second', factor: 1 },
      { id: 'kmh', label: 'Kilometers per hour', factor: 1 / 3.6 },
      { id: 'mph', label: 'Miles per hour', factor: 0.44704 },
      { id: 'kn', label: 'Knot', factor: 1852 / 3600 },
      { id: 'fts', label: 'Feet per second', factor: 0.3048 },
    ],
  },
  time: {
    label: 'Time',
    units: [
      { id: 'ms', label: 'Millisecond', factor: 0.001 },
      { id: 's', label: 'Second', factor: 1 },
      { id: 'min', label: 'Minute', factor: 60 },
      { id: 'h', label: 'Hour', factor: 3600 },
      { id: 'd', label: 'Day', factor: 86400 },
      { id: 'wk', label: 'Week', factor: 604800 },
      { id: 'yr', label: 'Year (365 days)', factor: 31536000 },
    ],
  },
  data: {
    label: 'Digital storage',
    units: [
      { id: 'bit', label: 'Bit', factor: 0.125 },
      { id: 'B', label: 'Byte', factor: 1 },
      { id: 'KB', label: 'Kilobyte (KB)', factor: 1e3 },
      { id: 'MB', label: 'Megabyte (MB)', factor: 1e6 },
      { id: 'GB', label: 'Gigabyte (GB)', factor: 1e9 },
      { id: 'TB', label: 'Terabyte (TB)', factor: 1e12 },
      { id: 'KiB', label: 'Kibibyte (KiB)', factor: 1024 },
      { id: 'MiB', label: 'Mebibyte (MiB)', factor: 1024 ** 2 },
      { id: 'GiB', label: 'Gibibyte (GiB)', factor: 1024 ** 3 },
    ],
  },
};

export function convertUnit(value: number, category: string, from: string, to: string): number {
  const cat = UNIT_CATEGORIES[category];
  if (!cat) throw new Error('Unknown category');
  const f = cat.units.find((u) => u.id === from);
  const t = cat.units.find((u) => u.id === to);
  if (!f || !t) throw new Error('Unknown unit');
  return (value * f.factor) / t.factor;
}

export function formatNumber(n: number, digits = 10): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) return n.toExponential(6);
  return Number(n.toPrecision(digits)).toLocaleString('en-US', { maximumFractionDigits: 10 });
}

/* --------------------------- Temperature ---------------------------- */

export type TempUnit = 'C' | 'F' | 'K' | 'R';
export function toCelsius(v: number, u: TempUnit): number {
  switch (u) {
    case 'C':
      return v;
    case 'F':
      return ((v - 32) * 5) / 9;
    case 'K':
      return v - 273.15;
    case 'R':
      return ((v - 491.67) * 5) / 9;
  }
}
export function fromCelsius(c: number, u: TempUnit): number {
  switch (u) {
    case 'C':
      return c;
    case 'F':
      return (c * 9) / 5 + 32;
    case 'K':
      return c + 273.15;
    case 'R':
      return ((c + 273.15) * 9) / 5;
  }
}
export const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/* ----------------------------- File size ---------------------------- */

export const SIZE_UNITS = {
  decimal: [
    ['B', 1],
    ['KB', 1e3],
    ['MB', 1e6],
    ['GB', 1e9],
    ['TB', 1e12],
    ['PB', 1e15],
  ],
  binary: [
    ['B', 1],
    ['KiB', 1024],
    ['MiB', 1024 ** 2],
    ['GiB', 1024 ** 3],
    ['TiB', 1024 ** 4],
    ['PiB', 1024 ** 5],
  ],
} as const;

export function toBytes(value: number, unit: string): number {
  const all = [...SIZE_UNITS.decimal, ...SIZE_UNITS.binary];
  const f = all.find(([u]) => u === unit);
  if (!f) throw new Error('Unknown unit');
  return value * f[1];
}

/* ------------------------------ Colors ------------------------------ */

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  let m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : undefined };
  }
  m = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(s);
  if (m) {
    const [r, g, b] = [m[1], m[2], m[3]].map(Number);
    if ([r, g, b].some((x) => x > 255)) return null;
    const a = m[4] ? (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : undefined;
    return { r, g, b, a };
  }
  m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(s);
  if (m) {
    const rgb = hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
    return { ...rgb, a: m[4] ? (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : undefined };
  }
  return null;
}

export function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl({ r, g, b }: RGB) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

export function rgbToHsv({ r, g, b }: RGB) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d) h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h = Math.round(h * 60 < 0 ? h * 60 + 360 : h * 60);
  return { h, s: Math.round(max ? (d / max) * 100 : 0), v: Math.round(max * 100) };
}

export function relativeLuminance({ r, g, b }: RGB): number {
  const c = [r, g, b].map((x) => {
    const v = x / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
