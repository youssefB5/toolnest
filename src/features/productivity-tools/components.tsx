import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Actions,
  Checkbox,
  CopyButton,
  DownloadButton,
  ErrorBox,
  Notice,
  NumberInput,
  Range,
  ResetButton,
  Segmented,
  Select,
  TextArea,
} from '../../components/tools/kit';
import { contrastRatio, parseColor } from '../converter-tools/logic';
import { gradientCss, lorem, qrPayload, type QrKind, type Stop } from './logic';

/* ------------------------------ QR code ----------------------------- */
export function QrCodeGenerator() {
  const [kind, setKind] = useState<QrKind>('url');
  const [f, setF] = useState<Record<string, string>>({ url: '', security: 'WPA' });
  const [size, setSize] = useState(512);
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [fg, setFg] = useState('#0f172a');
  const [bg, setBg] = useState('#ffffff');
  const [png, setPng] = useState<Blob | null>(null);
  const [svg, setSvg] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const payload = qrPayload(kind, f);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((o) => ({ ...o, [k]: e.target.value }));
  const fgC = parseColor(fg);
  const bgC = parseColor(bg);
  const lowContrast = fgC && bgC ? contrastRatio(fgC, bgC) < 3 : false;

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    if (!payload) {
      setPng(null);
      setSvg('');
      setPreview(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const QR = await import('qrcode');
        const opts = { errorCorrectionLevel: ecc, margin: 2, color: { dark: fg, light: bg } };
        const canvas = document.createElement('canvas');
        await QR.toCanvas(canvas, payload, { ...opts, width: size });
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
        const svgStr = await QR.toString(payload, { ...opts, type: 'svg', width: size });
        if (cancelled) return;
        url = blob ? URL.createObjectURL(blob) : null;
        setPng(blob);
        setSvg(svgStr);
        setPreview(url);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error && /too big|amount of data/i.test(e.message) ? 'Too much data for a QR code. Shorten the content or lower the error correction.' : String(e));
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (url) URL.revokeObjectURL(url);
    };
  }, [payload, size, ecc, fg, bg]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
      <div className="space-y-4">
        <Segmented
          label="Content type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'url', label: 'URL' },
            { value: 'text', label: 'Text' },
            { value: 'wifi', label: 'Wi-Fi' },
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'sms', label: 'SMS' },
          ]}
        />
        {kind === 'url' && (
          <div>
            <label className="label" htmlFor="qr-url">
              Website URL
            </label>
            <input id="qr-url" className="input" value={f.url ?? ''} onChange={set('url')} placeholder="https://example.com" inputMode="url" />
          </div>
        )}
        {kind === 'text' && <TextArea label="Text" value={f.text ?? ''} onChange={(v) => setF((o) => ({ ...o, text: v }))} rows={4} mono={false} maxLength={2900} />}
        {kind === 'wifi' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="qr-ssid">
                Network name (SSID)
              </label>
              <input id="qr-ssid" className="input" value={f.ssid ?? ''} onChange={set('ssid')} />
            </div>
            <div>
              <label className="label" htmlFor="qr-sec">
                Security
              </label>
              <select id="qr-sec" className="input" value={f.security} onChange={set('security')}>
                <option value="WPA">WPA/WPA2/WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
            {f.security !== 'nopass' && (
              <div>
                <label className="label" htmlFor="qr-pw">
                  Password
                </label>
                <input id="qr-pw" className="input" type="text" autoComplete="off" value={f.password ?? ''} onChange={set('password')} />
              </div>
            )}
            <div className="flex items-end">
              <Checkbox label="Hidden network" checked={f.hidden === 'true'} onChange={(v) => setF((o) => ({ ...o, hidden: String(v) }))} />
            </div>
          </div>
        )}
        {kind === 'email' && (
          <div className="grid gap-3">
            <input className="input" aria-label="Email address" placeholder="name@example.com" value={f.email ?? ''} onChange={set('email')} type="email" />
            <input className="input" aria-label="Subject" placeholder="Subject" value={f.subject ?? ''} onChange={set('subject')} />
            <textarea className="input" aria-label="Message" placeholder="Message" rows={3} value={f.body ?? ''} onChange={set('body')} />
          </div>
        )}
        {(kind === 'phone' || kind === 'sms') && (
          <div className="grid gap-3">
            <input className="input" aria-label="Phone number" placeholder="+33 6 12 34 56 78" value={f.phone ?? ''} onChange={set('phone')} type="tel" />
            {kind === 'sms' && <textarea className="input" aria-label="Message" placeholder="Message" rows={3} value={f.text ?? ''} onChange={set('text')} />}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Range label="Size" value={size} onChange={setSize} min={128} max={2048} step={64} format={(v) => `${v}px`} />
          <Select
            label="Error correction"
            value={ecc}
            onChange={setEcc}
            options={[
              { value: 'L', label: 'Low (7%) — most data' },
              { value: 'M', label: 'Medium (15%)' },
              { value: 'Q', label: 'Quartile (25%)' },
              { value: 'H', label: 'High (30%) — most robust' },
            ]}
          />
          <div className="flex items-center gap-3">
            <label htmlFor="qr-fg" className="text-sm">
              Foreground
            </label>
            <input id="qr-fg" type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-14 rounded border" />
            <label htmlFor="qr-bg" className="text-sm">
              Background
            </label>
            <input id="qr-bg" type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-14 rounded border" />
          </div>
        </div>
        {lowContrast && <Notice tone="warn">Low contrast between colors may make the code unreadable by scanners.</Notice>}
        <ErrorBox error={error} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-64 items-center justify-center rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700">
          {preview ? <img src={preview} alt={`QR code for ${payload.slice(0, 80)}`} className="size-full object-contain" /> : <span className="text-sm text-slate-400">Preview</span>}
        </div>
        <Actions>
          <DownloadButton blob={png} filename="qr-code.png" label="PNG" />
          <DownloadButton text={svg || undefined} filename="qr-code.svg" mime="image/svg+xml" label="SVG" primary={false} />
        </Actions>
      </div>
    </div>
  );
}

/* ----------------------------- CSS gradient ------------------------- */
export function CssGradientGenerator() {
  const [type, setType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<Stop[]>([
    { color: '#2563eb', pos: 0 },
    { color: '#0d9488', pos: 100 },
  ]);
  const css = gradientCss(type, angle, stops);
  const full = `background: ${stops[0]?.color ?? '#000'};\nbackground: ${css};`;
  const update = (i: number, patch: Partial<Stop>) => setStops((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <>
      <div className="h-48 rounded-xl border border-slate-200 dark:border-slate-700" style={{ background: css }} role="img" aria-label="Gradient preview" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented label="Type" value={type} onChange={setType} options={[{ value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }, { value: 'conic', label: 'Conic' }]} />
        {type !== 'radial' && <Range label="Angle" value={angle} onChange={setAngle} min={0} max={360} format={(v) => `${v}°`} />}
      </div>
      <ul className="space-y-2">
        {stops.map((s, i) => (
          <li key={i} className="flex items-center gap-3">
            <input type="color" aria-label={`Color stop ${i + 1}`} value={s.color} onChange={(e) => update(i, { color: e.target.value })} className="h-9 w-14 rounded border" />
            <input type="range" aria-label={`Position of stop ${i + 1}`} min={0} max={100} value={s.pos} onChange={(e) => update(i, { pos: Number(e.target.value) })} className="flex-1 accent-[var(--brand)]" />
            <span className="w-12 text-end text-sm tabular-nums">{s.pos}%</span>
            <button type="button" className="btn-ghost btn-sm" disabled={stops.length <= 2} onClick={() => setStops((st) => st.filter((_, j) => j !== i))} aria-label={`Remove stop ${i + 1}`}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <Actions>
        <button type="button" className="btn-secondary btn-sm" disabled={stops.length >= 8} onClick={() => setStops((s) => [...s, { color: '#f59e0b', pos: 50 }])}>
          <Plus className="size-4" aria-hidden="true" /> Add color stop
        </button>
        <ResetButton onClick={() => (setStops([{ color: '#2563eb', pos: 0 }, { color: '#0d9488', pos: 100 }]), setAngle(135), setType('linear'))} />
      </Actions>
      <TextArea label="CSS" value={full} readOnly rows={3} />
      <CopyButton text={full} />
    </>
  );
}

/* ---------------------------- Markdown preview ---------------------- */
const DRAFT_KEY = 'tn:markdown-draft';
const SAMPLE = `# Hello Markdown

Write **bold**, _italic_ and \`code\`.

- [x] Task lists
- [ ] Tables

| Tool | Free |
| ---- | ---- |
| ToolNest | Yes |

> Raw HTML like <script>alert(1)</script> is sanitized.
`;
export function MarkdownPreviewer() {
  const [md, setMd] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_KEY) ?? SAMPLE;
    } catch {
      return SAMPLE;
    }
  });
  const [html, setHtml] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ marked }, { default: DOMPurify }] = await Promise.all([import('marked'), import('dompurify')]);
      const raw = marked.parse(md, { gfm: true, async: false }) as string;
      const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input', 'iframe', 'object', 'embed'], ALLOW_DATA_ATTR: false });
      if (!cancelled) setHtml(clean);
    })();
    return () => {
      cancelled = true;
    };
  }, [md]);
  const doc = useMemo(() => `<!doctype html>\n<html><head><meta charset="utf-8"><title>Document</title></head><body>\n${html}\n</body></html>`, [html]);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <TextArea label="Markdown" value={md} onChange={setMd} rows={18} />
        <div>
          <span className="label">Preview</span>
          {/* html is sanitized by DOMPurify above */}
          <div className="prose-content min-h-[26rem] overflow-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
      <Actions>
        <CopyButton text={html} label="Copy HTML" />
        <DownloadButton text={doc} filename="document.html" mime="text/html" primary={false} />
        <DownloadButton text={md} filename="document.md" mime="text/markdown" label="Download .md" primary={false} />
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => {
            try {
              localStorage.setItem(DRAFT_KEY, md);
              setSaved(true);
              setTimeout(() => setSaved(false), 1500);
            } catch {
              /* ignore */
            }
          }}
        >
          {saved ? 'Saved locally ✓' : 'Save draft in this browser'}
        </button>
        <ResetButton
          onClick={() => {
            setMd('');
            try {
              localStorage.removeItem(DRAFT_KEY);
            } catch {
              /* ignore */
            }
          }}
        />
      </Actions>
    </>
  );
}

/* ------------------------------- Lorem ------------------------------ */
export function LoremIpsumGenerator() {
  const [unit, setUnit] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [count, setCount] = useState<number | ''>(3);
  const [classic, setClassic] = useState(true);
  const [html, setHtml] = useState(false);
  const [out, setOut] = useState('');
  const gen = () => setOut(lorem(unit, Number(count) || 1, { startClassic: classic, html }));
  useEffect(gen, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Generate" value={unit} onChange={setUnit} options={[{ value: 'paragraphs', label: 'Paragraphs' }, { value: 'sentences', label: 'Sentences' }, { value: 'words', label: 'Words' }]} />
        <NumberInput label="Amount" value={count} onChange={setCount} min={1} max={unit === 'words' ? 5000 : 200} step={1} />
        <div className="flex flex-col justify-end gap-2">
          <Checkbox label="Start with “Lorem ipsum…”" checked={classic} onChange={setClassic} />
          <Checkbox label="Wrap in <p> tags" checked={html} onChange={setHtml} />
        </div>
      </div>
      <Actions>
        <button type="button" className="btn-primary" onClick={gen}>
          Generate
        </button>
      </Actions>
      <TextArea label="Output" value={out} readOnly rows={12} mono={false} />
      <CopyButton text={out} />
    </>
  );
}
