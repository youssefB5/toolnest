/** Pure regex execution used inside the regex worker (and unit tests). */
export interface RegexRequest {
  mode: 'match' | 'replace';
  pattern: string;
  flags: string;
  input: string;
  replacement?: string;
  maxMatches?: number;
}

export interface RegexMatch {
  index: number;
  end: number;
  text: string;
  groups: (string | undefined)[];
  named: Record<string, string | undefined> | null;
}

export interface RegexResult {
  matches?: RegexMatch[];
  truncated?: boolean;
  output?: string;
  count?: number;
}

export function validateFlags(flags: string): string {
  const clean = Array.from(new Set(flags.replace(/[^dgimsuyv]/g, '').split(''))).join('');
  if (clean.includes('u') && clean.includes('v')) throw new Error('Flags “u” and “v” cannot be combined.');
  return clean;
}

export function executeRegex(req: RegexRequest): RegexResult {
  if (req.pattern.length > 5000) throw new Error('Pattern is too long (max 5,000 characters).');
  const flags = validateFlags(req.flags);
  let re: RegExp;
  try {
    re = new RegExp(req.pattern, flags);
  } catch (e) {
    throw new Error(`Invalid regular expression: ${e instanceof Error ? e.message.replace(/^Invalid regular expression: /, '') : e}`, { cause: e });
  }
  const max = req.maxMatches ?? 10_000;
  if (req.mode === 'replace') {
    let count = 0;
    const output = req.input.replace(re, (...args) => {
      count++;
      // emulate $-substitutions manually so we can count matches
      const match = args[0] as string;
      const hasNamed = typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null;
      const groups = args.slice(1, hasNamed ? -3 : -2) as (string | undefined)[];
      const named = hasNamed ? (args[args.length - 1] as Record<string, string>) : {};
      return (req.replacement ?? '').replace(/\$(\$|&|\d{1,2}|<[^>]+>)/g, (_m, g: string) => {
        if (g === '$') return '$';
        if (g === '&') return match;
        if (g.startsWith('<')) return named[g.slice(1, -1)] ?? '';
        const n = Number(g);
        return n >= 1 && n <= groups.length ? (groups[n - 1] ?? '') : `$${g}`;
      });
    });
    return { output, count };
  }
  const matches: RegexMatch[] = [];
  let truncated = false;
  if (!re.global && !re.sticky) {
    const m = re.exec(req.input);
    if (m) matches.push({ index: m.index, end: m.index + m[0].length, text: m[0], groups: m.slice(1), named: m.groups ?? null });
    return { matches, truncated };
  }
  let m: RegExpExecArray | null;
  while ((m = re.exec(req.input)) !== null) {
    matches.push({ index: m.index, end: m.index + m[0].length, text: m[0], groups: m.slice(1), named: m.groups ?? null });
    if (m[0] === '') re.lastIndex++; // avoid infinite loop on empty matches
    if (matches.length >= max) {
      truncated = true;
      break;
    }
  }
  return { matches, truncated };
}
