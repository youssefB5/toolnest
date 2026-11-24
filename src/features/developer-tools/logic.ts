/* Pure developer-tool functions (no DOM). */

/* ------------------------------ JSON -------------------------------- */

export interface JsonError {
  message: string;
  position: number;
  line: number;
  column: number;
}

export function positionToLineCol(text: string, pos: number) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      col = 1;
    } else col++;
  }
  return { line, column: col };
}

/** Strict RFC 8259 validator that reports the first error position (engine-independent). */
export function locateJsonError(text: string): JsonError | null {
  let i = 0;
  const fail = (msg: string): never => {
    const { line, column } = positionToLineCol(text, i);
    throw { message: msg, position: i, line, column } satisfies JsonError;
  };
  const ws = () => {
    while (i < text.length && ' \t\n\r'.includes(text[i])) i++;
  };
  const value = (depth: number): void => {
    if (depth > 1000) fail('Nesting too deep');
    ws();
    const c = text[i];
    if (c === '{') {
      i++;
      ws();
      if (text[i] === '}') return void i++;
      for (;;) {
        ws();
        if (text[i] !== '"') fail('Expected a double-quoted property name');
        string();
        ws();
        if (text[i] !== ':') fail('Expected “:” after property name');
        i++;
        value(depth + 1);
        ws();
        if (text[i] === ',') {
          i++;
          ws();
          if (text[i] === '}') fail('Trailing comma is not allowed in JSON');
          continue;
        }
        if (text[i] === '}') return void i++;
        fail('Expected “,” or “}”');
      }
    } else if (c === '[') {
      i++;
      ws();
      if (text[i] === ']') return void i++;
      for (;;) {
        value(depth + 1);
        ws();
        if (text[i] === ',') {
          i++;
          ws();
          if (text[i] === ']') fail('Trailing comma is not allowed in JSON');
          continue;
        }
        if (text[i] === ']') return void i++;
        fail('Expected “,” or “]”');
      }
    } else if (c === '"') string();
    else if (c === '-' || (c >= '0' && c <= '9')) number();
    else if (text.startsWith('true', i)) i += 4;
    else if (text.startsWith('false', i)) i += 5;
    else if (text.startsWith('null', i)) i += 4;
    else if (c === undefined) fail('Unexpected end of input');
    else if (c === "'") fail('Strings must use double quotes');
    else if (c === '/') fail('Comments are not allowed in JSON');
    else fail(`Unexpected character “${c}”`);
  };
  const string = () => {
    i++;
    while (i < text.length) {
      const c = text[i];
      if (c === '"') return void i++;
      if (c === '\\') {
        const n = text[i + 1];
        if (n === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail('Invalid \\u escape');
          i += 6;
          continue;
        }
        if (!'"\\/bfnrt'.includes(n ?? '')) fail('Invalid escape sequence');
        i += 2;
        continue;
      }
      if (c < ' ') fail('Control characters must be escaped in strings');
      i++;
    }
    fail('Unterminated string');
  };
  const number = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail('Invalid number');
    i += m![0].length;
  };
  try {
    value(0);
    ws();
    if (i < text.length) fail('Unexpected data after the JSON value');
    return null;
  } catch (e) {
    if (e && typeof e === 'object' && 'position' in e) return e as JsonError;
    throw e;
  }
}

function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v as object)
        .sort()
        .map((k) => [k, sortDeep((v as Record<string, unknown>)[k])]),
    );
  }
  return v;
}

export function formatJson(text: string, indent: number | '\t' | 0, sortKeys = false): { output: string } | { error: JsonError } {
  const err = locateJsonError(text.trim() === '' ? '' : text);
  if (err) return { error: err };
  let v = JSON.parse(text);
  if (sortKeys) v = sortDeep(v);
  return { output: indent === 0 ? JSON.stringify(v) : JSON.stringify(v, null, indent) };
}

/* ------------------------------ XML --------------------------------- */

/** Tokenizing XML pretty-printer (formatting only; well-formedness is checked with DOMParser in the UI). */
export function formatXml(xml: string, indent = '  ', minify = false): string {
  const tokens = xml.replace(/>\s+</g, '><').trim().match(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<\/?[^>]+>|[^<]+/g) ?? [];
  if (minify) return tokens.map((t) => (t.startsWith('<') ? t : t.trim())).join('');
  let depth = 0;
  const out: string[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    const pad = indent.repeat(depth);
    if (t.startsWith('</')) {
      depth = Math.max(0, depth - 1);
      out.push(indent.repeat(depth) + t);
    } else if (t.startsWith('<?') || t.startsWith('<!')) {
      out.push(pad + t);
    } else if (t.startsWith('<')) {
      const selfClosing = t.endsWith('/>');
      // inline <tag>text</tag> on one line
      const next = tokens[k + 1];
      const after = tokens[k + 2];
      if (!selfClosing && next && !next.startsWith('<') && after && after.startsWith('</')) {
        out.push(pad + t + next.trim() + after);
        k += 2;
        continue;
      }
      out.push(pad + t);
      if (!selfClosing) depth++;
    } else {
      const txt = t.trim();
      if (txt) out.push(pad + txt);
    }
  }
  return out.join('\n');
}

/* --------------------------- URL / Base64 --------------------------- */

export function urlEncode(s: string, mode: 'component' | 'full'): string {
  return mode === 'component' ? encodeURIComponent(s) : encodeURI(s);
}

export function urlDecode(s: string, plusAsSpace = true): string {
  const input = plusAsSpace ? s.replace(/\+/g, ' ') : s;
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error('The input contains a malformed percent-encoded sequence (e.g. an incomplete “%E0%A4”).');
  }
}

export function parseUrlParts(s: string) {
  try {
    const u = new URL(s.trim());
    return {
      protocol: u.protocol,
      host: u.host,
      pathname: u.pathname,
      hash: u.hash,
      params: [...u.searchParams.entries()],
    };
  } catch {
    return null;
  }
}

export function base64EncodeUtf8(s: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const b64 = btoa(bin);
  return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64;
}

export function base64ToBytes(s: string): Uint8Array {
  let clean = s.replace(/^data:[^,]*,/, '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error('The input contains characters that are not valid Base64.');
  clean = clean.replace(/=+$/, '');
  if (clean.length % 4 === 1) throw new Error('Invalid Base64 length — the data looks truncated.');
  clean += '='.repeat((4 - (clean.length % 4)) % 4);
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function base64DecodeUtf8(s: string): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(base64ToBytes(s));
}

/* ---------------------------- HTML entities ------------------------- */

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0', copy: '©', reg: '®', trade: '™', hellip: '…',
  mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', euro: '€', pound: '£',
  yen: '¥', cent: '¢', sect: '§', para: '¶', deg: '°', plusmn: '±', times: '×', divide: '÷', middot: '·', bull: '•',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', atilde: 'ã', aring: 'å',
  iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï', oacute: 'ó', ograve: 'ò', ocirc: 'ô', ouml: 'ö', otilde: 'õ', oslash: 'ø',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü', ccedil: 'ç', ntilde: 'ñ', szlig: 'ß', aelig: 'æ', oelig: 'œ', yuml: 'ÿ',
  Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Ccedil: 'Ç', Ntilde: 'Ñ', Ouml: 'Ö', Uuml: 'Ü',
  iexcl: '¡', iquest: '¿', larr: '←', rarr: '→', uarr: '↑', darr: '↓', harr: '↔', hearts: '♥', check: '✓', infin: '∞',
  ne: '≠', le: '≤', ge: '≥', frac12: '½', frac14: '¼', frac34: '¾', sup2: '²', sup3: '³', micro: 'µ', thinsp: '\u2009',
  ensp: '\u2002', emsp: '\u2003', zwj: '\u200D', zwnj: '\u200C', lrm: '\u200E', rlm: '\u200F', shy: '\u00AD',
};
const REVERSE: Record<string, string> = Object.fromEntries(Object.entries(NAMED).map(([k, v]) => [v, k]));

export function encodeEntities(s: string, mode: 'basic' | 'all' | 'named'): string {
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (ch === '&') out += '&amp;';
    else if (ch === '<') out += '&lt;';
    else if (ch === '>') out += '&gt;';
    else if (ch === '"') out += '&quot;';
    else if (ch === "'") out += '&#39;';
    else if (mode !== 'basic' && cp > 126) out += mode === 'named' && REVERSE[ch] ? `&${REVERSE[ch]};` : `&#${cp};`;
    else out += ch;
  }
  return out;
}

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]{1,6}|#\d{1,7}|[A-Za-z][A-Za-z0-9]{1,31});/g, (m, body: string) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(cp) || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return '�';
      return String.fromCodePoint(cp);
    }
    return NAMED[body] ?? m;
  });
}

/* ------------------------------- JWT -------------------------------- */

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  times: { claim: string; date: Date }[];
  expired: boolean | null;
  notYetValid: boolean;
}

export function decodeJwt(token: string, now = Date.now()): DecodedJwt {
  const parts = token.trim().replace(/^Bearer\s+/i, '').split('.');
  if (parts.length === 5) throw new Error('This looks like an encrypted token (JWE). Its contents cannot be decoded without the key.');
  if (parts.length !== 3) throw new Error('A JWT must have three parts separated by dots (header.payload.signature).');
  const part = (p: string, name: string) => {
    try {
      const v = JSON.parse(base64DecodeUtf8(p));
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error();
      return v as Record<string, unknown>;
    } catch {
      throw new Error(`The ${name} is not valid Base64URL-encoded JSON.`);
    }
  };
  const header = part(parts[0], 'header');
  const payload = part(parts[1], 'payload');
  const times: { claim: string; date: Date }[] = [];
  for (const claim of ['iat', 'nbf', 'exp', 'auth_time']) {
    const v = payload[claim];
    if (typeof v === 'number' && Number.isFinite(v)) times.push({ claim, date: new Date(v * 1000) });
  }
  const exp = typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  const nbf = typeof payload.nbf === 'number' ? payload.nbf * 1000 : null;
  return {
    header,
    payload,
    signature: parts[2],
    times,
    expired: exp === null ? null : exp <= now,
    notYetValid: nbf !== null && nbf > now,
  };
}

/* ---------------------------- Timestamps ---------------------------- */

export function parseTimestamp(input: string): { ms: number; unit: 'seconds' | 'milliseconds' | 'microseconds' } | null {
  const s = input.trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const abs = Math.abs(n);
  if (abs >= 1e14) return { ms: n / 1000, unit: 'microseconds' };
  if (abs >= 1e11) return { ms: n, unit: 'milliseconds' };
  return { ms: n * 1000, unit: 'seconds' };
}

export function formatInZone(ms: number, timeZone: string, locale = 'en-GB') {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) throw new Error('Date out of range.');
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(d);
}

export function relativeTime(ms: number, now = Date.now()): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
    ['second', 1000],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [u, size] of units) if (abs >= size || u === 'second') return rtf.format(Math.round(diff / size), u);
  return '';
}
