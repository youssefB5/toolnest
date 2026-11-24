/* ---------------------------- QR payloads --------------------------- */

const escWifi = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');

export type QrKind = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms';

export function qrPayload(kind: QrKind, f: Record<string, string>): string {
  switch (kind) {
    case 'url': {
      const u = (f.url ?? '').trim();
      if (!u) return '';
      return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`;
    }
    case 'text':
      return f.text ?? '';
    case 'wifi': {
      if (!f.ssid) return '';
      const sec = f.security === 'nopass' ? 'nopass' : f.security || 'WPA';
      return `WIFI:T:${sec};S:${escWifi(f.ssid)};${sec !== 'nopass' ? `P:${escWifi(f.password ?? '')};` : ''}${f.hidden === 'true' ? 'H:true;' : ''};`;
    }
    case 'email': {
      if (!f.email) return '';
      const q = new URLSearchParams();
      if (f.subject) q.set('subject', f.subject);
      if (f.body) q.set('body', f.body);
      const qs = q.toString().replace(/\+/g, '%20');
      return `mailto:${f.email}${qs ? `?${qs}` : ''}`;
    }
    case 'phone':
      return f.phone ? `tel:${f.phone.replace(/[^\d+]/g, '')}` : '';
    case 'sms':
      return f.phone ? `SMSTO:${f.phone.replace(/[^\d+]/g, '')}:${f.text ?? ''}` : '';
  }
}

/* ------------------------------ Gradient ---------------------------- */

export interface Stop {
  color: string;
  pos: number; // 0..100
}

export function gradientCss(type: 'linear' | 'radial' | 'conic', angle: number, stops: Stop[], shape: 'circle' | 'ellipse' = 'circle') {
  const s = [...stops].sort((a, b) => a.pos - b.pos).map((x) => `${x.color} ${Math.round(x.pos)}%`).join(', ');
  if (type === 'linear') return `linear-gradient(${Math.round(angle)}deg, ${s})`;
  if (type === 'radial') return `radial-gradient(${shape} at center, ${s})`;
  return `conic-gradient(from ${Math.round(angle)}deg at center, ${s})`;
}

/* ------------------------------- Lorem ------------------------------ */

const WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nunc vitae porta dictum mauris integer posuere erat a ante venenatis dapibus morbi leo risus porta ac vestibulum maecenas faucibus mollis interdum donec ullamcorper nulla non metus auctor fringilla'.split(
    ' ',
  );

type Rand = () => number;
const pick = (r: Rand) => WORDS[Math.floor(r() * WORDS.length)];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function sentence(r: Rand): string {
  const len = 6 + Math.floor(r() * 10);
  const words = Array.from({ length: len }, () => pick(r));
  if (len > 9 && r() > 0.5) words[Math.floor(len / 2)] += ',';
  return cap(words.join(' ')) + '.';
}

function paragraph(r: Rand): string {
  return Array.from({ length: 4 + Math.floor(r() * 4) }, () => sentence(r)).join(' ');
}

export function lorem(unit: 'paragraphs' | 'sentences' | 'words', count: number, opts: { startClassic: boolean; html: boolean }, rand: Rand = Math.random): string {
  const n = Math.max(1, Math.min(unit === 'words' ? 5000 : 200, Math.floor(count)));
  const classic = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  if (unit === 'words') {
    const words = Array.from({ length: n }, () => pick(rand));
    if (opts.startClassic) ['lorem', 'ipsum', 'dolor', 'sit', 'amet'].slice(0, n).forEach((w, i) => (words[i] = w));
    const t = cap(words.join(' ')) + '.';
    return opts.html ? `<p>${t}</p>` : t;
  }
  if (unit === 'sentences') {
    const s = Array.from({ length: n }, () => sentence(rand));
    if (opts.startClassic) s[0] = classic;
    const t = s.join(' ');
    return opts.html ? `<p>${t}</p>` : t;
  }
  const ps = Array.from({ length: n }, () => paragraph(rand));
  if (opts.startClassic) ps[0] = `${classic} ${ps[0]}`;
  return opts.html ? ps.map((p) => `<p>${p}</p>`).join('\n') : ps.join('\n\n');
}
