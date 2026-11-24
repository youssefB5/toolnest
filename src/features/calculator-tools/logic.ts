export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function percentOf(p: number, of: number) {
  return (p / 100) * of;
}
export function whatPercent(part: number, whole: number): number | null {
  return whole === 0 ? null : (part / whole) * 100;
}
export function percentChange(from: number, to: number): number | null {
  return from === 0 ? null : ((to - from) / Math.abs(from)) * 100;
}

export interface Discount {
  type: 'percent' | 'amount';
  value: number;
}

export function applyDiscounts(price: number, discounts: Discount[]) {
  let final = price;
  for (const d of discounts) {
    if (!Number.isFinite(d.value) || d.value <= 0) continue;
    final = d.type === 'percent' ? final * (1 - Math.min(100, d.value) / 100) : Math.max(0, final - d.value);
  }
  const saved = price - final;
  return { final: round2(final), saved: round2(saved), effectivePercent: price > 0 ? round2((saved / price) * 100) : 0 };
}

export function vat(amount: number, rate: number, mode: 'add' | 'remove') {
  if (mode === 'add') {
    const tax = amount * (rate / 100);
    return { net: round2(amount), tax: round2(tax), gross: round2(amount + tax) };
  }
  const net = amount / (1 + rate / 100);
  return { net: round2(net), tax: round2(amount - net), gross: round2(amount) };
}

/** Parse yyyy-mm-dd as a local calendar date (avoids timezone shifts). */
export function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
}

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const DAY = 86_400_000;
export const daysBetween = (a: Date, b: Date) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY);

/** Calendar difference in years, months and days (a <= b). */
export function ymdDiff(a: Date, b: Date) {
  // Add whole months to `a` (clamping the day, e.g. Jan 31 + 1 month = Feb 28/29),
  // take the largest count that does not pass `b`, then count the remaining days.
  const addMonths = (m: number) => {
    const total = a.getMonth() + m;
    const y = a.getFullYear() + Math.floor(total / 12);
    const mo = ((total % 12) + 12) % 12;
    return new Date(y, mo, Math.min(a.getDate(), daysInMonth(y, mo)));
  };
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (daysBetween(addMonths(months), b) < 0) months--;
  const days = daysBetween(addMonths(months), b);
  return { years: Math.floor(months / 12), months: months % 12, days };
}

export function age(birth: Date, on: Date) {
  if (birth > on) return null;
  const diff = ymdDiff(birth, on);
  const totalDays = daysBetween(birth, on);
  // next birthday (29 Feb -> 28 Feb in non-leap years)
  const nextYear = (y: number) => {
    const m = birth.getMonth();
    const d = Math.min(birth.getDate(), daysInMonth(y, m));
    return new Date(y, m, d);
  };
  let next = nextYear(on.getFullYear());
  if (daysBetween(on, next) < 0) next = nextYear(on.getFullYear() + 1);
  const untilNext = daysBetween(on, next);
  return {
    ...diff,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: diff.years * 12 + diff.months,
    nextBirthdayInDays: untilNext,
    isBirthdayToday: untilNext === 0,
    weekdayBorn: birth.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

export function businessDays(a: Date, b: Date, includeEnd: boolean): number {
  const start = a <= b ? a : b;
  const end = a <= b ? b : a;
  const total = daysBetween(start, end) + (includeEnd ? 1 : 0);
  const full = Math.floor(total / 7);
  let count = full * 5;
  const startDow = start.getDay();
  for (let i = 0; i < total % 7; i++) {
    const dow = (startDow + full * 7 + i) % 7;
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export function dateDifference(a: Date, b: Date, includeEnd: boolean) {
  const forward = a <= b;
  const start = forward ? a : b;
  const end = forward ? b : a;
  const days = daysBetween(start, end) + (includeEnd ? 1 : 0);
  const endAdj = includeEnd ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : end;
  return {
    ...ymdDiff(start, endAdj),
    totalDays: days,
    weeks: Math.floor(days / 7),
    remDays: days % 7,
    businessDays: businessDays(start, end, includeEnd),
    hours: days * 24,
    reversed: !forward,
  };
}

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

const COMMON = [
  [1, 1],
  [4, 3],
  [3, 2],
  [16, 10],
  [16, 9],
  [21, 9],
  [32, 9],
  [5, 4],
  [2, 1],
  [9, 16],
  [3, 4],
  [2, 3],
  [4, 5],
];

export function aspectRatio(w: number, h: number) {
  if (w <= 0 || h <= 0) return null;
  const g = gcd(w, h);
  const ratio = w / h;
  let closest = COMMON[0];
  for (const c of COMMON) if (Math.abs(c[0] / c[1] - ratio) < Math.abs(closest[0] / closest[1] - ratio)) closest = c;
  return { x: Math.round(w / g), y: Math.round(h / g), decimal: Math.round(ratio * 10000) / 10000, closest: `${closest[0]}:${closest[1]}` };
}

export function solveRatio(rx: number, ry: number, width: number | null, height: number | null) {
  if (rx <= 0 || ry <= 0) return null;
  if (width && width > 0) return { width, height: Math.round((width * ry) / rx * 100) / 100 };
  if (height && height > 0) return { width: Math.round((height * rx) / ry * 100) / 100, height };
  return null;
}
