/* All randomness comes from crypto.getRandomValues (CSPRNG). */

export function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return hexUuid(b);
}

/** RFC 9562 UUIDv7: 48-bit Unix ms timestamp + random bits. */
export function uuidV7(now = Date.now()): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let ts = now;
  for (let i = 5; i >= 0; i--) {
    b[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return hexUuid(b);
}

function hexUuid(b: Uint8Array): string {
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~',
};
const AMBIGUOUS = /[O0oIl1|`'"]/g;

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

/** Uniform random index in [0, max) via rejection sampling (no modulo bias). */
export function randomIndex(max: number): number {
  if (max < 1 || max > 0x1_0000_0000) throw new Error('Invalid range');
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

export function generatePassword(o: PasswordOptions): string {
  const length = Math.max(4, Math.min(128, Math.floor(o.length)));
  const groups = (['lower', 'upper', 'digits', 'symbols'] as const)
    .filter((k) => o[k])
    .map((k) => (o.excludeAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]));
  if (!groups.length) throw new Error('Select at least one character set.');
  const all = groups.join('');
  const chars: string[] = [];
  // guarantee at least one char from each selected group
  for (const g of groups) chars.push(g[randomIndex(g.length)]);
  while (chars.length < length) chars.push(all[randomIndex(all.length)]);
  // Fisher–Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join('');
}

export function entropyBits(o: PasswordOptions): number {
  const pool = (['lower', 'upper', 'digits', 'symbols'] as const)
    .filter((k) => o[k])
    .reduce((s, k) => s + (o.excludeAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]).length, 0);
  return pool ? Math.round(o.length * Math.log2(pool)) : 0;
}

export function strengthLabel(bits: number): { label: string; level: 0 | 1 | 2 | 3 } {
  if (bits < 40) return { label: 'Weak', level: 0 };
  if (bits < 64) return { label: 'Fair', level: 1 };
  if (bits < 100) return { label: 'Strong', level: 2 };
  return { label: 'Very strong', level: 3 };
}

export type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export async function digest(algo: HashAlgo, data: BufferSource): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest(algo, data));
}

export const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
export function toBase64(b: Uint8Array) {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}
