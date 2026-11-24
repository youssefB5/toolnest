/**
 * Parse a human page selection like "1-3, 5, 8-" into zero-based groups.
 * Each comma-separated part becomes one group (used by Split);
 * `flattenRanges` merges them (used by Extract/Rotate).
 */
export function parsePageRanges(input: string, pageCount: number): number[][] {
  const text = input.trim();
  if (!text) throw new Error('Enter at least one page or range, e.g. “1-3, 5”.');
  const groups: number[][] = [];
  for (const raw of text.split(/[,;]+/)) {
    const part = raw.trim();
    if (!part) continue;
    const m = /^(\d+)?\s*(?:-|–|to)\s*(\d+)?$/i.exec(part);
    let start: number;
    let end: number;
    if (/^\d+$/.test(part)) start = end = Number(part);
    else if (m && (m[1] || m[2])) {
      start = m[1] ? Number(m[1]) : 1;
      end = m[2] ? Number(m[2]) : pageCount;
    } else throw new Error(`“${part}” is not a valid page or range.`);
    if (start < 1 || end < 1) throw new Error('Page numbers start at 1.');
    if (start > pageCount || end > pageCount) throw new Error(`“${part}” is outside the document (it has ${pageCount} page${pageCount === 1 ? '' : 's'}).`);
    const step = start <= end ? 1 : -1;
    const g: number[] = [];
    for (let p = start; step > 0 ? p <= end : p >= end; p += step) g.push(p - 1);
    groups.push(g);
  }
  if (!groups.length) throw new Error('No pages selected.');
  return groups;
}

export function flattenRanges(groups: number[][]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const g of groups)
    for (const p of g) {
      if (seen.has(p)) continue;
      seen.add(p);
      out.push(p);
    }
  return out;
}

export function chunkPages(pageCount: number, size: number): number[][] {
  const n = Math.max(1, Math.floor(size));
  const out: number[][] = [];
  for (let i = 0; i < pageCount; i += n) out.push(Array.from({ length: Math.min(n, pageCount - i) }, (_, k) => i + k));
  return out;
}

export function describeGroup(g: number[]): string {
  if (!g.length) return '';
  const first = g[0] + 1;
  const last = g[g.length - 1] + 1;
  return first === last ? `${first}` : `${first}-${last}`;
}
