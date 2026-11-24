/* Pure text-processing functions (no DOM). Unit-tested in tests/unit/text.test.ts */

const segmenterAvailable = typeof Intl !== 'undefined' && 'Segmenter' in Intl;

export function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/);
}

export function countGraphemes(text: string): number {
  if (!text) return 0;
  if (segmenterAvailable) {
    let n = 0;
    for (const _ of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) n++;
    return n;
  }
  return Array.from(text).length;
}

export function getWords(text: string): string[] {
  // Unicode letters/numbers, keeping internal apostrophes and hyphens (don't, state-of-the-art)
  return text.match(/[\p{L}\p{N}\p{M}]+(?:['’-][\p{L}\p{N}\p{M}]+)*/gu) ?? [];
}

const STOP = new Set(
  'the a an and or of to in on for with is are was were be it this that as at by from not but your you we they i he she his her its our their de la le les et un une des du en est pour que qui dans sur au aux par pas plus من في على إلى عن أن'.split(
    ' ',
  ),
);

export interface WordStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  avgWordLength: number;
  readingMinutes: number;
  speakingMinutes: number;
  topWords: { word: string; count: number; percent: number }[];
}

export function wordStats(text: string): WordStats {
  const words = getWords(text);
  const trimmed = text.trim();
  const sentences = trimmed ? (trimmed.match(/[^.!?…。؟]+[.!?…。؟]+(?=\s|$)|[^.!?…。؟]+$/g) ?? []).filter((s) => /[\p{L}\p{N}]/u.test(s)).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const freq = new Map<string, number>();
  for (const w of words) {
    const k = w.toLocaleLowerCase();
    if (k.length < 3 || STOP.has(k)) continue;
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const topWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word, count]) => ({ word, count, percent: words.length ? Math.round((count / words.length) * 1000) / 10 : 0 }));
  const letters = words.reduce((s, w) => s + Array.from(w).length, 0);
  return {
    words: words.length,
    characters: countGraphemes(text),
    charactersNoSpaces: countGraphemes(text.replace(/\s/g, '')),
    sentences,
    paragraphs,
    lines: text ? splitLines(text).length : 0,
    avgWordLength: words.length ? Math.round((letters / words.length) * 10) / 10 : 0,
    readingMinutes: words.length / 238,
    speakingMinutes: words.length / 150,
    topWords,
  };
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 sec';
  const totalSec = Math.max(1, Math.round(minutes * 60));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m ? `${m} min${s ? ` ${s} sec` : ''}` : `${s} sec`;
}

export interface CharStats {
  characters: number;
  utf16Units: number;
  noSpaces: number;
  bytes: number;
  words: number;
  lines: number;
}

export function charStats(text: string): CharStats {
  return {
    characters: countGraphemes(text),
    utf16Units: text.length,
    noSpaces: countGraphemes(text.replace(/\s/g, '')),
    bytes: new TextEncoder().encode(text).length,
    words: getWords(text).length,
    lines: text ? splitLines(text).length : 0,
  };
}

export type CaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'alternating'
  | 'inverse'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'constant'
  | 'kebab'
  | 'dot';

const SMALL_WORDS = new Set('a an and as at but by for if in nor of on or so the to up via vs yet'.split(' '));

function identifierWords(text: string): string[] {
  return text
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper':
      return text.toLocaleUpperCase();
    case 'lower':
      return text.toLocaleLowerCase();
    case 'title': {
      let first = true;
      return text.toLocaleLowerCase().replace(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu, (w, offset: number, full: string) => {
        const prev = full.slice(Math.max(0, offset - 2), offset);
        const startOfSentence = first || /[.!?:]\s*$/.test(prev);
        first = false;
        if (!startOfSentence && SMALL_WORDS.has(w)) return w;
        return w.charAt(0).toLocaleUpperCase() + w.slice(1);
      });
    }
    case 'sentence':
      return text
        .toLocaleLowerCase()
        .replace(/(^\s*\p{L}|[.!?]\s+\p{L}|\n\s*\p{L})/gu, (m) => m.toLocaleUpperCase())
        .replace(/\bi\b/g, 'I');
    case 'alternating': {
      let i = 0;
      return Array.from(text)
        .map((c) => (/\p{L}/u.test(c) ? (i++ % 2 ? c.toLocaleUpperCase() : c.toLocaleLowerCase()) : c))
        .join('');
    }
    case 'inverse':
      return Array.from(text)
        .map((c) => (c === c.toLocaleUpperCase() ? c.toLocaleLowerCase() : c.toLocaleUpperCase()))
        .join('');
    default: {
      return splitLines(text)
        .map((line) => {
          const words = identifierWords(line).map((w) => w.toLocaleLowerCase());
          if (!words.length) return '';
          const cap = (w: string) => w.charAt(0).toLocaleUpperCase() + w.slice(1);
          switch (mode) {
            case 'camel':
              return words[0] + words.slice(1).map(cap).join('');
            case 'pascal':
              return words.map(cap).join('');
            case 'snake':
              return words.join('_');
            case 'constant':
              return words.join('_').toLocaleUpperCase();
            case 'kebab':
              return words.join('-');
            case 'dot':
              return words.join('.');
          }
          return line;
        })
        .join('\n');
    }
  }
}

export interface DedupeOptions {
  ignoreCase: boolean;
  trim: boolean;
  removeEmpty: boolean;
}

export function removeDuplicateLines(text: string, o: DedupeOptions): { text: string; removed: number; kept: number } {
  const seen = new Set<string>();
  const out: string[] = [];
  let removed = 0;
  for (const raw of splitLines(text)) {
    const line = o.trim ? raw.trim() : raw;
    if (o.removeEmpty && line.trim() === '') {
      removed++;
      continue;
    }
    const key = o.ignoreCase ? line.toLocaleLowerCase() : line;
    if (seen.has(key)) {
      removed++;
      continue;
    }
    seen.add(key);
    out.push(line);
  }
  return { text: out.join('\n'), removed, kept: out.length };
}

export type SortMode = 'alpha' | 'natural' | 'length' | 'reverse' | 'shuffle';

export function secureRandomInt(max: number): number {
  // rejection sampling to avoid modulo bias
  if (max <= 0) return 0;
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

export function sortLines(
  text: string,
  mode: SortMode,
  opts: { descending?: boolean; ignoreCase?: boolean; removeEmpty?: boolean } = {},
): string {
  let lines = splitLines(text);
  if (opts.removeEmpty) lines = lines.filter((l) => l.trim() !== '');
  const collator = new Intl.Collator(undefined, {
    sensitivity: opts.ignoreCase ? 'base' : 'variant',
    numeric: mode === 'natural',
  });
  if (mode === 'reverse') return lines.reverse().join('\n');
  if (mode === 'shuffle') {
    for (let i = lines.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    return lines.join('\n');
  }
  const cmp =
    mode === 'length' ? (a: string, b: string) => a.length - b.length || collator.compare(a, b) : (a: string, b: string) => collator.compare(a, b);
  lines.sort(cmp);
  if (opts.descending) lines.reverse();
  return lines.join('\n');
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Plain-text find & replace (regex mode is handled by the regex worker). */
export function replacePlain(
  text: string,
  find: string,
  replacement: string,
  opts: { caseSensitive: boolean; wholeWord: boolean },
): { text: string; count: number } {
  if (!find) return { text, count: 0 };
  const src = opts.wholeWord ? `(?<![\\p{L}\\p{N}_])${escapeRegExp(find)}(?![\\p{L}\\p{N}_])` : escapeRegExp(find);
  const re = new RegExp(src, `g${opts.caseSensitive ? '' : 'i'}u`);
  let count = 0;
  const out = text.replace(re, () => {
    count++;
    return replacement;
  });
  return { text: out, count };
}

export interface SlugOptions {
  separator: '-' | '_' | '.';
  lowercase: boolean;
  asciiOnly: boolean;
  maxLength: number;
  removeStopWords?: boolean;
}

const TRANSLIT: Record<string, string> = {
  ß: 'ss', æ: 'ae', Æ: 'AE', ø: 'o', Ø: 'O', œ: 'oe', Œ: 'OE', ł: 'l', Ł: 'L', đ: 'd', Đ: 'D', þ: 'th', ð: 'd', '&': ' and ',
};

export function slugify(input: string, o: SlugOptions): string {
  let s = input.replace(/[ßæÆøØœŒłŁđĐþð&]/g, (c) => TRANSLIT[c] ?? c);
  s = s.normalize('NFKD').replace(/\p{M}+/gu, '');
  if (o.lowercase) s = s.toLocaleLowerCase();
  s = o.asciiOnly ? s.replace(/[^A-Za-z0-9]+/g, ' ') : s.replace(/[^\p{L}\p{N}]+/gu, ' ');
  let words = s.trim().split(/\s+/).filter(Boolean);
  if (o.removeStopWords) words = words.filter((w) => !SMALL_WORDS.has(w.toLowerCase()));
  let slug = words.join(o.separator);
  if (o.maxLength > 0 && slug.length > o.maxLength) {
    slug = slug.slice(0, o.maxLength);
    const cut = slug.lastIndexOf(o.separator);
    if (cut > o.maxLength * 0.5) slug = slug.slice(0, cut);
  }
  return slug.replace(new RegExp(`${escapeRegExp(o.separator)}+$`), '');
}

export interface LineNumberOptions {
  start: number;
  step: number;
  pad: boolean;
  separator: string;
  skipEmpty: boolean;
}

export function addLineNumbers(text: string, o: LineNumberOptions): string {
  const lines = splitLines(text);
  const numbered = lines.filter((l) => !(o.skipEmpty && l.trim() === '')).length;
  const last = o.start + (numbered - 1) * o.step;
  const width = o.pad ? String(Math.max(Math.abs(last), Math.abs(o.start))).length : 0;
  let n = o.start;
  return lines
    .map((l) => {
      if (o.skipEmpty && l.trim() === '') return l;
      const label = o.pad ? String(n).padStart(width, '0') : String(n);
      n += o.step;
      return `${label}${o.separator}${l}`;
    })
    .join('\n');
}

/* ---------------------------- diff --------------------------------- */

export type DiffOp = { type: 'equal' | 'insert' | 'delete'; value: string };

/** LCS-based diff of token arrays with prefix/suffix trimming and a size guard. */
export function diffTokens(a: string[], b: string[], maxCells = 4_000_000): { ops: DiffOp[]; reduced: boolean } {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const ops: DiffOp[] = a.slice(0, start).map((value) => ({ type: 'equal', value }));
  let reduced = false;
  const n = midA.length;
  const m = midB.length;
  if (n * m > maxCells) {
    reduced = true;
    midA.forEach((value) => ops.push({ type: 'delete', value }));
    midB.forEach((value) => ops.push({ type: 'insert', value }));
  } else if (n || m) {
    // DP table of LCS lengths (Uint32 rows)
    const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--) dp[i][j] = midA[i] === midB[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (midA[i] === midB[j]) {
        ops.push({ type: 'equal', value: midA[i] });
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ type: 'delete', value: midA[i++] });
      else ops.push({ type: 'insert', value: midB[j++] });
    }
    while (i < n) ops.push({ type: 'delete', value: midA[i++] });
    while (j < m) ops.push({ type: 'insert', value: midB[j++] });
  }
  for (const value of a.slice(endA)) ops.push({ type: 'equal', value });
  return { ops, reduced };
}

export function diffText(a: string, b: string, mode: 'line' | 'word') {
  const tok = (s: string) => (mode === 'line' ? splitLines(s) : s.split(/(\s+)/).filter((x) => x !== ''));
  const res = diffTokens(tok(a), tok(b));
  const stats = { added: 0, removed: 0, unchanged: 0 };
  for (const op of res.ops) {
    if (mode === 'word' && /^\s+$/.test(op.value)) continue;
    if (op.type === 'insert') stats.added++;
    else if (op.type === 'delete') stats.removed++;
    else stats.unchanged++;
  }
  return { ...res, stats };
}
