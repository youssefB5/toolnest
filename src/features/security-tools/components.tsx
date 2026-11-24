import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Actions,
  Checkbox,
  CopyButton,
  DownloadButton,
  ErrorBox,
  FileDrop,
  FileRow,
  Notice,
  NumberInput,
  Progress,
  Range,
  ResetButton,
  Segmented,
  TextArea,
  useTask,
} from '../../components/tools/kit';
import type { ValidatedFile } from '../../lib/file-processing/validate';
import type { DetectedType } from '../../lib/file-processing/detect';
import { digest, entropyBits, generatePassword, strengthLabel, toBase64, toHex, uuidV4, uuidV7, type HashAlgo, type PasswordOptions } from './logic';

/* ------------------------------- UUID ------------------------------- */
export function UuidGenerator() {
  const [version, setVersion] = useState<'v4' | 'v7'>('v4');
  const [count, setCount] = useState<number | ''>(5);
  const [upper, setUpper] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [list, setList] = useState<string[]>([]);
  const gen = () => {
    const n = Math.max(1, Math.min(1000, Number(count) || 1));
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      let u = version === 'v4' ? uuidV4() : uuidV7();
      if (!hyphens) u = u.replace(/-/g, '');
      if (upper) u = u.toUpperCase();
      out.push(u);
    }
    setList(out);
  };
  useEffect(gen, []); // eslint-disable-line react-hooks/exhaustive-deps
  const text = list.join('\n');
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <span className="label">Version</span>
          <Segmented label="Version" value={version} onChange={setVersion} options={[{ value: 'v4', label: 'v4 (random)' }, { value: 'v7', label: 'v7 (time-ordered)' }]} />
        </div>
        <NumberInput label="Quantity (max 1000)" value={count} onChange={setCount} min={1} max={1000} step={1} />
        <div className="flex flex-col justify-end gap-2">
          <Checkbox label="Uppercase" checked={upper} onChange={setUpper} />
          <Checkbox label="Hyphens" checked={hyphens} onChange={setHyphens} />
        </div>
      </div>
      <Actions>
        <button type="button" className="btn-primary" onClick={gen}>
          <RefreshCw className="size-4" aria-hidden="true" /> Generate
        </button>
      </Actions>
      <TextArea label="UUIDs" value={text} readOnly rows={Math.min(14, Math.max(4, list.length))} />
      <Actions>
        <CopyButton text={text} />
        <DownloadButton text={text} filename="uuids.txt" primary={false} />
      </Actions>
    </>
  );
}

/* ----------------------------- Password ----------------------------- */
export function PasswordGenerator() {
  const [o, setO] = useState<PasswordOptions>({ length: 20, lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false });
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const gen = (opts = o) => {
    try {
      setPw(generatePassword(opts));
      setError(null);
    } catch (e) {
      setPw('');
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => gen(o), [o]); // eslint-disable-line react-hooks/exhaustive-deps
  const bits = entropyBits(o);
  const s = strengthLabel(bits);
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  const toggle = (k: keyof PasswordOptions) => (v: boolean) => setO((x) => ({ ...x, [k]: v }));
  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
        <output className="min-w-0 flex-1 overflow-x-auto font-mono text-lg break-all text-slate-900 dark:text-white" aria-live="polite" aria-label="Generated password">
          {pw}
        </output>
        <button type="button" className="btn-ghost btn-sm" onClick={() => gen()} aria-label="Generate a new password">
          <RefreshCw className="size-4" aria-hidden="true" />
        </button>
        <CopyButton text={pw} />
      </div>
      <div>
        <div className="flex justify-between text-sm">
          <span>
            Strength: <strong>{s.label}</strong>
          </span>
          <span className="tabular-nums text-slate-500">≈ {bits} bits of entropy</span>
        </div>
        <div className="mt-1 grid grid-cols-4 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 rounded-full ${i <= s.level ? colors[s.level] : 'bg-slate-200 dark:bg-slate-800'}`} />
          ))}
        </div>
      </div>
      <Range label="Length" value={o.length} onChange={(v) => setO((x) => ({ ...x, length: v }))} min={4} max={128} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Checkbox label="Lowercase (a–z)" checked={o.lower} onChange={toggle('lower')} />
        <Checkbox label="Uppercase (A–Z)" checked={o.upper} onChange={toggle('upper')} />
        <Checkbox label="Digits (0–9)" checked={o.digits} onChange={toggle('digits')} />
        <Checkbox label="Symbols (!@#…)" checked={o.symbols} onChange={toggle('symbols')} />
        <Checkbox label="Exclude look-alikes (O 0 l 1 I |)" checked={o.excludeAmbiguous} onChange={toggle('excludeAmbiguous')} />
      </div>
      <ErrorBox error={error} />
      <Notice tone="success">Generated locally with crypto.getRandomValues. Passwords are never stored or transmitted.</Notice>
    </>
  );
}

/* ------------------------------- Hash ------------------------------- */
const ANY: DetectedType[] = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/x-icon', 'image/avif', 'image/heic', 'image/tiff', 'image/svg+xml',
  'application/pdf', 'application/zip', 'text/plain', 'unknown',
];
export function Sha256Hash() {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [algo, setAlgo] = useState<HashAlgo>('SHA-256');
  const [text, setText] = useState('');
  const [file, setFile] = useState<ValidatedFile | null>(null);
  const [hash, setHash] = useState<Uint8Array | null>(null);
  const [fmt, setFmt] = useState<'hex' | 'base64'>('hex');
  const [expected, setExpected] = useState('');
  const { busy, error, setError, run } = useTask();

  useEffect(() => {
    let cancelled = false;
    if (mode !== 'text') return;
    digest(algo, new TextEncoder().encode(text)).then((h) => !cancelled && setHash(h));
    return () => {
      cancelled = true;
    };
  }, [text, algo, mode]);
  useEffect(() => {
    if (mode !== 'file' || !file) return;
    run(async () => {
      const buf = await file.file.arrayBuffer();
      setHash(await digest(algo, buf));
    });
  }, [file, algo, mode, run]);

  const out = hash ? (fmt === 'hex' ? toHex(hash) : toBase64(hash)) : '';
  const cmp = expected.trim().toLowerCase().replace(/\s+/g, '');
  const match = cmp ? cmp === out.toLowerCase() : null;
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Segmented label="Input" value={mode} onChange={(m) => (setMode(m), setHash(null))} options={[{ value: 'text', label: 'Text' }, { value: 'file', label: 'File' }]} />
        <Segmented label="Algorithm" value={algo} onChange={setAlgo} options={(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as HashAlgo[]).map((a) => ({ value: a, label: a }))} />
      </div>
      {algo === 'SHA-1' && <Notice tone="warn">SHA-1 is broken for collision resistance. Use it only to compare legacy checksums.</Notice>}
      {mode === 'text' ? (
        <TextArea label="Text (UTF-8)" value={text} onChange={setText} rows={5} />
      ) : (
        <>
          {!file && <FileDrop accept={ANY} acceptAttr="*/*" acceptLabel="Any file" onFiles={([f]) => setFile(f)} onError={setError} />}
          {file && (
            <ul>
              <FileRow file={file} onRemove={() => (setFile(null), setHash(null))} />
            </ul>
          )}
          {busy && <Progress value={null} />}
        </>
      )}
      <ErrorBox error={error} />
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="label mb-0">{algo} hash</span>
          <Segmented label="Output format" value={fmt} onChange={setFmt} options={[{ value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]} />
        </div>
        <output className="block rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm break-all dark:border-slate-800 dark:bg-slate-950">{out || '—'}</output>
      </div>
      <Actions>
        <CopyButton text={out} />
        <ResetButton onClick={() => (setText(''), setFile(null), setHash(null), setExpected(''))} />
      </Actions>
      <div>
        <label className="label" htmlFor="h-exp">
          Compare with expected checksum (optional)
        </label>
        <input id="h-exp" className="input font-mono" value={expected} onChange={(e) => setExpected(e.target.value)} />
        {match === true && <p className="mt-2 text-sm font-semibold text-emerald-600">✓ Match — the data is identical.</p>}
        {match === false && <p className="mt-2 text-sm font-semibold text-red-600">✗ No match.</p>}
      </div>
    </>
  );
}
