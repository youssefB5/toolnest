/**
 * Small, dependency-free fuzzy search tuned for a catalog of tool names.
 * Scoring combines: exact/prefix matches on title, token matches on title,
 * keywords and category, subsequence matches and typo tolerance (Damerau-ish
 * edit distance ≤ 1–2 for longer tokens).
 */
export interface SearchDoc {
  id: string;
  title: string;
  short: string;
  keywords: string[];
  category: string;
  categoryTitle: string;
  href: string;
  icon: string;
  popular?: boolean;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean);
}

export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

function isSubsequence(q: string, s: string): boolean {
  let i = 0;
  for (const ch of s) if (ch === q[i]) i++;
  return i === q.length;
}

function tokenScore(qt: string, words: string[], weight: number): number {
  let best = 0;
  for (const w of words) {
    if (w === qt) best = Math.max(best, 10 * weight);
    else if (w.startsWith(qt)) best = Math.max(best, 7 * weight);
    else if (qt.length >= 3 && w.includes(qt)) best = Math.max(best, 5 * weight);
    else if (qt.length >= 4) {
      const d = editDistance(qt, w.slice(0, Math.max(qt.length, Math.min(w.length, qt.length + 1))), 2);
      const allowed = qt.length >= 7 ? 2 : 1;
      if (d <= allowed) best = Math.max(best, (allowed - d + 1) * 2 * weight);
    }
  }
  return best;
}

export function search(docs: SearchDoc[], query: string, limit = 8): SearchDoc[] {
  const q = normalize(query);
  if (!q) return [];
  const qTokens = q.split(' ');
  const scored: { doc: SearchDoc; score: number }[] = [];
  for (const doc of docs) {
    const title = normalize(doc.title);
    const titleWords = title.split(' ');
    const kwWords = doc.keywords.flatMap(tokens);
    const catWords = tokens(doc.categoryTitle + ' ' + doc.category.replace(/-/g, ' '));
    const shortWords = tokens(doc.short);
    let score = 0;
    if (title === q) score += 100;
    else if (title.startsWith(q)) score += 60;
    else if (title.includes(q)) score += 40;
    if (doc.keywords.some((k) => normalize(k) === q)) score += 50;
    let matchedAll = true;
    for (const qt of qTokens) {
      const s = Math.max(
        tokenScore(qt, titleWords, 3),
        tokenScore(qt, kwWords, 2),
        tokenScore(qt, catWords, 1.5),
        tokenScore(qt, shortWords, 1),
      );
      if (s === 0) matchedAll = false;
      score += s;
    }
    if (!matchedAll) score *= 0.4;
    if (score === 0 && q.length >= 3 && isSubsequence(q.replace(/ /g, ''), title.replace(/ /g, ''))) score = 4;
    if (score > 0 && doc.popular) score += 2;
    if (score > 0) scored.push({ doc, score });
  }
  scored.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  return scored.slice(0, limit).map((s) => s.doc);
}
