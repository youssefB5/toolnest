import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Actions,
  Checkbox,
  CopyButton,
  DownloadButton,
  ErrorBox,
  Notice,
  ResetButton,
  Segmented,
  Select,
  TextArea,
  useToolEnv,
} from '../../components/tools/kit';
import { runRegex } from '../../lib/regex/client';
import type { RegexMatch } from '../../lib/regex/execute';
import {
  base64DecodeUtf8,
  base64EncodeUtf8,
  decodeEntities,
  decodeJwt,
  encodeEntities,
  formatInZone,
  formatJson,
  formatXml,
  parseTimestamp,
  parseUrlParts,
  relativeTime,
  urlDecode,
  urlEncode,
} from './logic';

/* ------------------------------ JSON -------------------------------- */
export function JsonFormatter() {
  const { ui } = useToolEnv();
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('2');
  const [out, setOut] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  const run = (kind: 'format' | 'minify' | 'sort') => {
    const r = formatJson(input, kind === 'minify' ? 0 : indent === 'tab' ? '\t' : Number(indent), kind === 'sort');
    if ('error' in r) {
      setError(`Invalid JSON at line ${r.error.line}, column ${r.error.column}: ${r.error.message}.`);
      setValid(false);
      setOut('');
    } else {
      setError(null);
      setValid(true);
      setOut(r.output);
    }
  };
  return (
    <>
      <TextArea label={ui['ui.input']} value={input} onChange={setInput} rows={12} placeholder='{"name":"ToolNest","tools":60}' />
      <Actions>
        <Segmented label="Indentation" value={indent} onChange={setIndent} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }]} />
        <button type="button" className="btn-primary" onClick={() => run('format')} disabled={!input.trim()}>
          Format / Validate
        </button>
        <button type="button" className="btn-secondary" onClick={() => run('minify')} disabled={!input.trim()}>
          Minify
        </button>
        <button type="button" className="btn-secondary" onClick={() => run('sort')} disabled={!input.trim()}>
          Sort keys
        </button>
      </Actions>
      <ErrorBox error={error} />
      {valid && <Notice tone="success">Valid JSON ✓</Notice>}
      <TextArea label={ui['ui.output']} value={out} readOnly rows={12} />
      <Actions>
        <CopyButton text={out} />
        <DownloadButton text={out} filename="formatted.json" mime="application/json" primary={false} />
        <ResetButton onClick={() => (setInput(''), setOut(''), setError(null), setValid(null))} />
      </Actions>
    </>
  );
}

/* ------------------------------- XML -------------------------------- */
function xmlError(xml: string): string | null {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (!err) return null;
  return (err.textContent || 'The XML is not well-formed.').replace(/\s+/g, ' ').trim().slice(0, 400);
}
export function XmlFormatter() {
  const { ui } = useToolEnv();
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('2');
  const [out, setOut] = useState('');
  const [error, setError] = useState<string | null>(null);
  const run = (minify: boolean) => {
    const e = xmlError(input);
    if (e) {
      setError(`Not well-formed: ${e}`);
      setOut('');
      return;
    }
    setError(null);
    setOut(formatXml(input, indent === 'tab' ? '\t' : ' '.repeat(Number(indent)), minify));
  };
  return (
    <>
      <TextArea label={ui['ui.input']} value={input} onChange={setInput} rows={12} placeholder="<root><item id='1'>Hello</item></root>" />
      <Actions>
        <Segmented label="Indentation" value={indent} onChange={setIndent} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }]} />
        <button type="button" className="btn-primary" onClick={() => run(false)} disabled={!input.trim()}>
          Format
        </button>
        <button type="button" className="btn-secondary" onClick={() => run(true)} disabled={!input.trim()}>
          Minify
        </button>
      </Actions>
      <ErrorBox error={error} />
      <TextArea label={ui['ui.output']} value={out} readOnly rows={12} />
      <Actions>
        <CopyButton text={out} />
        <DownloadButton text={out} filename="formatted.xml" mime="application/xml" primary={false} />
        <ResetButton onClick={() => (setInput(''), setOut(''), setError(null))} />
      </Actions>
    </>
  );
}

/* ------------------------------ URL --------------------------------- */
export function UrlEncoder() {
  const { ui } = useToolEnv();
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<'encode' | 'decode'>('encode');
  const [mode, setMode] = useState<'component' | 'full'>('component');
  const [plus, setPlus] = useState(true);
  const res = useMemo(() => {
    if (!input) return { out: '', error: null as string | null };
    try {
      return { out: dir === 'encode' ? urlEncode(input, mode) : urlDecode(input, plus), error: null };
    } catch (e) {
      return { out: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dir, mode, plus]);
  const parts = useMemo(() => parseUrlParts(dir === 'decode' ? res.out || input : input), [input, res.out, dir]);
  return (
    <>
      <Actions>
        <Segmented label="Direction" value={dir} onChange={setDir} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
        {dir === 'encode' ? (
          <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'component', label: 'Component' }, { value: 'full', label: 'Full URL' }]} />
        ) : (
          <Checkbox label="Treat + as space" checked={plus} onChange={setPlus} />
        )}
      </Actions>
      <TextArea label={ui['ui.input']} value={input} onChange={setInput} rows={5} />
      <ErrorBox error={res.error} />
      <TextArea label={ui['ui.output']} value={res.out} readOnly rows={5} />
      <Actions>
        <CopyButton text={res.out} />
        <ResetButton onClick={() => setInput('')} />
      </Actions>
      {parts && (
        <div className="overflow-x-auto">
          <h3 className="mb-2 text-sm font-semibold">URL breakdown</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Protocol', parts.protocol],
                ['Host', parts.host],
                ['Path', parts.pathname],
                ['Fragment', parts.hash || '—'],
              ].map(([k, v]) => (
                <tr key={k} className="border-t border-slate-100 dark:border-slate-800">
                  <th className="w-32 py-1.5 text-start font-medium text-slate-500">{k}</th>
                  <td className="py-1.5 font-mono break-all">{v}</td>
                </tr>
              ))}
              {parts.params.map(([k, v], i) => (
                <tr key={`${k}-${i}`} className="border-t border-slate-100 dark:border-slate-800">
                  <th className="py-1.5 text-start font-mono font-medium text-slate-500">?{k}</th>
                  <td className="py-1.5 font-mono break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Base64 ------------------------------ */
export function Base64Text() {
  const { ui } = useToolEnv();
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const res = useMemo(() => {
    if (!input) return { out: '', error: null as string | null };
    try {
      return { out: dir === 'encode' ? base64EncodeUtf8(input, urlSafe) : base64DecodeUtf8(input), error: null };
    } catch (e) {
      return { out: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dir, urlSafe]);
  return (
    <>
      <Actions>
        <Segmented label="Direction" value={dir} onChange={setDir} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
        {dir === 'encode' && <Checkbox label="URL-safe (Base64URL, no padding)" checked={urlSafe} onChange={setUrlSafe} />}
      </Actions>
      <TextArea label={ui['ui.input']} value={input} onChange={setInput} rows={6} />
      <ErrorBox error={res.error} />
      <TextArea label={ui['ui.output']} value={res.out} readOnly rows={6} />
      <Actions>
        <CopyButton text={res.out} />
        <ResetButton onClick={() => setInput('')} />
      </Actions>
    </>
  );
}

/* --------------------------- HTML entities -------------------------- */
export function HtmlEntityEncoder() {
  const { ui } = useToolEnv();
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<'encode' | 'decode'>('encode');
  const [mode, setMode] = useState<'basic' | 'named' | 'all'>('basic');
  const out = useMemo(() => (dir === 'encode' ? encodeEntities(input, mode) : decodeEntities(input)), [input, dir, mode]);
  return (
    <>
      <Actions>
        <Segmented label="Direction" value={dir} onChange={setDir} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
        {dir === 'encode' && (
          <Select
            label="Characters to encode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'basic', label: 'Only & < > " \'' },
              { value: 'named', label: 'Also non-ASCII (named where possible)' },
              { value: 'all', label: 'Also non-ASCII (numeric)' },
            ]}
          />
        )}
      </Actions>
      <TextArea label={ui['ui.input']} value={input} onChange={setInput} rows={7} placeholder='<p class="x">Café & crème</p>' />
      <TextArea label={ui['ui.output']} value={out} readOnly rows={7} />
      <Actions>
        <CopyButton text={out} />
        <ResetButton onClick={() => setInput('')} />
      </Actions>
    </>
  );
}

/* -------------------------------- JWT ------------------------------- */
export function JwtDecoder() {
  const [token, setToken] = useState('');
  const res = useMemo(() => {
    if (!token.trim()) return null;
    try {
      return { ok: decodeJwt(token) } as const;
    } catch (e) {
      return { err: e instanceof Error ? e.message : String(e) } as const;
    }
  }, [token]);
  return (
    <>
      <Notice tone="warn">
        <strong>Decoding is not verification.</strong> This tool does NOT check the signature. Anyone can create a token with any content, so never trust a
        token’s claims just because it decodes.
      </Notice>
      <TextArea label="JSON Web Token" value={token} onChange={setToken} rows={5} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" />
      {res && 'err' in res && <ErrorBox error={res.err ?? null} />}
      {res && 'ok' in res && res.ok && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {res.ok.expired === true && <span className="badge bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">Expired</span>}
            {res.ok.expired === false && <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">Not expired</span>}
            {res.ok.expired === null && <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">No exp claim</span>}
            {res.ok.notYetValid && <span className="badge bg-amber-100 text-amber-800">Not yet valid (nbf)</span>}
            {typeof res.ok.header.alg === 'string' && <span className="badge bg-slate-100 dark:bg-slate-800">alg: {String(res.ok.header.alg)}</span>}
            {res.ok.header.alg === 'none' && <span className="badge bg-red-100 text-red-800">Unsigned token (alg: none)</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextArea label="Header" value={JSON.stringify(res.ok.header, null, 2)} readOnly rows={8} />
            <TextArea label="Payload" value={JSON.stringify(res.ok.payload, null, 2)} readOnly rows={8} />
          </div>
          {res.ok.times.length > 0 && (
            <table className="w-full text-sm">
              <tbody>
                {res.ok.times.map((x) => (
                  <tr key={x.claim} className="border-t border-slate-100 dark:border-slate-800">
                    <th className="w-24 py-1.5 text-start font-mono font-medium">{x.claim}</th>
                    <td className="py-1.5">
                      {x.date.toISOString()} <span className="text-slate-500">({relativeTime(x.date.getTime())})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Actions>
            <CopyButton text={JSON.stringify(res.ok.payload, null, 2)} label="Copy payload" />
            <ResetButton onClick={() => setToken('')} />
          </Actions>
        </div>
      )}
    </>
  );
}

/* --------------------------- Unix timestamp ------------------------- */
const ZONES = ['UTC', 'Europe/London', 'Europe/Paris', 'Africa/Casablanca', 'Africa/Cairo', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Sao_Paulo'];
export function UnixTimestampConverter() {
  const [now, setNow] = useState(() => Date.now());
  const [ts, setTs] = useState('');
  const [dt, setDt] = useState('');
  const [zone, setZone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const parsed = useMemo(() => (ts ? parseTimestamp(ts) : null), [ts]);
  const fromTs = useMemo(() => {
    if (!parsed) return null;
    try {
      const d = new Date(parsed.ms);
      if (Number.isNaN(d.getTime())) return { err: 'Date out of range.' };
      return { iso: d.toISOString(), utc: d.toUTCString(), zoned: formatInZone(parsed.ms, zone), rel: relativeTime(parsed.ms) };
    } catch (e) {
      return { err: e instanceof Error ? e.message : String(e) };
    }
  }, [parsed, zone]);
  const fromDate = useMemo(() => {
    if (!dt) return null;
    const ms = new Date(dt).getTime();
    return Number.isNaN(ms) ? null : { s: Math.floor(ms / 1000), ms };
  }, [dt]);
  const zones = ZONES.includes(zone) ? ZONES : [zone, ...ZONES];
  return (
    <>
      <div className="rounded-lg bg-slate-900 p-4 text-center text-white">
        <div className="text-xs tracking-wide text-slate-400 uppercase">Current Unix time</div>
        <div className="mt-1 font-mono text-3xl tabular-nums" aria-live="off">
          {Math.floor(now / 1000)}
        </div>
        <div className="mt-1 text-xs text-slate-400">{new Date(now).toISOString()}</div>
      </div>
      <Select label="Time zone" value={zone} onChange={setZone} options={zones.map((z) => ({ value: z, label: z }))} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="label" htmlFor="ts-in">
            Timestamp → date
          </label>
          <input id="ts-in" className="input font-mono" inputMode="numeric" value={ts} onChange={(e) => setTs(e.target.value)} placeholder={String(Math.floor(now / 1000))} />
          {ts && !parsed && <ErrorBox error="Enter digits only (seconds, milliseconds or microseconds)." />}
          {parsed && fromTs && 'err' in fromTs && <ErrorBox error={fromTs.err ?? null} />}
          {parsed && fromTs && 'iso' in fromTs && (
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="inline font-medium">Detected unit: </dt>
                <dd className="inline">{parsed.unit}</dd>
              </div>
              <div>
                <dt className="inline font-medium">ISO 8601: </dt>
                <dd className="inline font-mono">{fromTs.iso}</dd>
              </div>
              <div>
                <dt className="inline font-medium">UTC: </dt>
                <dd className="inline">{fromTs.utc}</dd>
              </div>
              <div>
                <dt className="inline font-medium">{zone}: </dt>
                <dd className="inline">{fromTs.zoned}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Relative: </dt>
                <dd className="inline">{fromTs.rel}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="space-y-3">
          <label className="label" htmlFor="dt-in">
            Date → timestamp (your local time)
          </label>
          <input id="dt-in" type="datetime-local" step="1" className="input" value={dt} onChange={(e) => setDt(e.target.value)} />
          {fromDate && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>
                  Seconds: <code className="font-mono">{fromDate.s}</code>
                </span>
                <CopyButton text={String(fromDate.s)} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>
                  Milliseconds: <code className="font-mono">{fromDate.ms}</code>
                </span>
                <CopyButton text={String(fromDate.ms)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------ Regex ------------------------------- */
export function RegexTester() {
  const [pattern, setPattern] = useState('\\b(\\w+)@(\\w+)\\.com\\b');
  const [flags, setFlags] = useState('g');
  const [input, setInput] = useState('Contact alice@example.com or bob@test.com.');
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    const id = ++runId.current;
    if (!pattern) {
      setMatches([]);
      setError(null);
      return;
    }
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await runRegex({ mode: 'match', pattern, flags, input: input.slice(0, 1_000_000) });
        if (id !== runId.current) return;
        setMatches(r.matches ?? []);
        setTruncated(!!r.truncated);
        setError(null);
      } catch (e) {
        if (id !== runId.current) return;
        setMatches([]);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (id === runId.current) setBusy(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [pattern, flags, input]);

  const highlighted = useMemo(() => {
    const parts: { text: string; m: boolean; i?: number }[] = [];
    let last = 0;
    matches.slice(0, 2000).forEach((m, i) => {
      if (m.index > last) parts.push({ text: input.slice(last, m.index), m: false });
      if (m.end > m.index) parts.push({ text: input.slice(m.index, m.end), m: true, i });
      last = Math.max(last, m.end);
    });
    parts.push({ text: input.slice(last), m: false });
    return parts;
  }, [matches, input]);

  const FLAG_LIST = [
    ['g', 'global'],
    ['i', 'ignore case'],
    ['m', 'multiline'],
    ['s', 'dotAll'],
    ['u', 'unicode'],
    ['y', 'sticky'],
  ];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="label" htmlFor="rx-p">
            Pattern
          </label>
          <div className="flex items-center rounded-lg border border-slate-300 bg-white font-mono focus-within:ring-2 focus-within:ring-brand-200 dark:border-slate-700 dark:bg-slate-950">
            <span className="ps-3 text-slate-400">/</span>
            <input id="rx-p" className="w-full bg-transparent px-1 py-2 text-sm outline-none" value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} maxLength={5000} />
            <span className="pe-3 text-slate-400">/{flags}</span>
          </div>
        </div>
        <fieldset>
          <legend className="label">Flags</legend>
          <div className="flex flex-wrap gap-1">
            {FLAG_LIST.map(([f, name]) => (
              <button
                key={f}
                type="button"
                title={name}
                aria-pressed={flags.includes(f)}
                onClick={() => setFlags((cur) => (cur.includes(f) ? cur.replace(f, '') : cur + f))}
                className={`rounded-md border px-2.5 py-1.5 font-mono text-sm ${flags.includes(f) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <TextArea label="Test string" value={input} onChange={setInput} rows={7} />
      <ErrorBox error={error} />
      <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
        {busy ? 'Evaluating…' : `${matches.length}${truncated ? '+' : ''} match${matches.length === 1 ? '' : 'es'}`}
      </p>
      <div className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-3 font-mono text-[13px] dark:border-slate-800 dark:bg-slate-950" aria-label="Highlighted matches">
        {highlighted.map((p, i) =>
          p.m ? (
            <mark key={i} className={`rounded px-0.5 ${p.i! % 2 ? 'bg-amber-200 dark:bg-amber-700/60' : 'bg-sky-200 dark:bg-sky-700/60'} text-inherit`}>
              {p.text}
            </mark>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </div>
      {matches.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="py-1 text-start font-medium">#</th>
                <th className="py-1 text-start font-medium">Index</th>
                <th className="py-1 text-start font-medium">Match</th>
                <th className="py-1 text-start font-medium">Groups</th>
              </tr>
            </thead>
            <tbody>
              {matches.slice(0, 200).map((m, i) => (
                <tr key={i} className="border-t border-slate-100 align-top dark:border-slate-800">
                  <td className="py-1.5 tabular-nums">{i + 1}</td>
                  <td className="py-1.5 tabular-nums">{m.index}</td>
                  <td className="py-1.5 font-mono break-all">{m.text || <em className="text-slate-400">(empty)</em>}</td>
                  <td className="py-1.5 font-mono text-xs break-all">
                    {m.groups.map((g, gi) => (
                      <div key={gi}>
                        ${gi + 1}: {g ?? <em className="text-slate-400">undefined</em>}
                      </div>
                    ))}
                    {m.named &&
                      Object.entries(m.named).map(([k, v]) => (
                        <div key={k}>
                          {k}: {v}
                        </div>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {matches.length > 200 && <p className="mt-2 text-xs text-slate-500">Showing the first 200 matches.</p>}
        </div>
      )}
    </>
  );
}
