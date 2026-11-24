import { useDeferredValue, useMemo, useState } from 'react';
import {
  Actions,
  Checkbox,
  CopyButton,
  DownloadButton,
  ErrorBox,
  Notice,
  NumberInput,
  ResetButton,
  Segmented,
  Select,
  Stat,
  TextArea,
  useToolEnv,
} from '../../components/tools/kit';
import { runRegex } from '../../lib/regex/client';
import {
  addLineNumbers,
  charStats,
  convertCase,
  diffText,
  formatDuration,
  removeDuplicateLines,
  replacePlain,
  slugify,
  sortLines,
  wordStats,
  type CaseMode,
  type SortMode,
} from './logic';

const fmt = (n: number) => n.toLocaleString();

/* --------------------------- Word counter --------------------------- */
export function WordCounter() {
  const { ui } = useToolEnv();
  const [text, setText] = useState('');
  const deferred = useDeferredValue(text);
  const s = useMemo(() => wordStats(deferred), [deferred]);
  return (
    <>
      <TextArea label={ui['ui.input']} value={text} onChange={setText} rows={12} mono={false} placeholder="Paste or type your text here…" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Words" value={fmt(s.words)} />
        <Stat label="Characters" value={fmt(s.characters)} />
        <Stat label="Without spaces" value={fmt(s.charactersNoSpaces)} />
        <Stat label="Sentences" value={fmt(s.sentences)} />
        <Stat label="Paragraphs" value={fmt(s.paragraphs)} />
        <Stat label="Avg. word length" value={s.avgWordLength} />
        <Stat label="Reading time" value={formatDuration(s.readingMinutes)} />
        <Stat label="Speaking time" value={formatDuration(s.speakingMinutes)} />
      </div>
      {s.topWords.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Keyword density</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-xs text-slate-500">
                <th className="py-1 text-start font-medium">Word</th>
                <th className="py-1 text-end font-medium">Count</th>
                <th className="py-1 text-end font-medium">Density</th>
              </tr>
            </thead>
            <tbody>
              {s.topWords.map((w) => (
                <tr key={w.word} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5">{w.word}</td>
                  <td className="py-1.5 text-end tabular-nums">{w.count}</td>
                  <td className="py-1.5 text-end tabular-nums">{w.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Actions>
        <ResetButton onClick={() => setText('')} />
      </Actions>
    </>
  );
}

/* ------------------------ Character counter ------------------------ */
const LIMITS = [
  { label: 'SEO title', max: 60 },
  { label: 'Meta description', max: 160 },
  { label: 'SMS (GSM-7)', max: 160 },
  { label: 'X / Twitter post', max: 280 },
  { label: 'Instagram caption', max: 2200 },
];
export function CharacterCounter() {
  const { ui } = useToolEnv();
  const [text, setText] = useState('');
  const s = useMemo(() => charStats(text), [text]);
  return (
    <>
      <TextArea label={ui['ui.input']} value={text} onChange={setText} rows={8} mono={false} placeholder="Type or paste text…" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Characters" value={fmt(s.characters)} />
        <Stat label="Without spaces" value={fmt(s.noSpaces)} />
        <Stat label="UTF-16 units" value={fmt(s.utf16Units)} />
        <Stat label="UTF-8 bytes" value={fmt(s.bytes)} />
        <Stat label="Words" value={fmt(s.words)} />
        <Stat label="Lines" value={fmt(s.lines)} />
      </div>
      <div className="space-y-3">
        {LIMITS.map((l) => {
          const pct = Math.min(100, (s.characters / l.max) * 100);
          const over = s.characters > l.max;
          return (
            <div key={l.label}>
              <div className="flex justify-between text-sm">
                <span>{l.label}</span>
                <span className={`tabular-nums ${over ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                  {s.characters} / {l.max}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
                <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-brand-600'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* --------------------------- Case converter ------------------------ */
const CASES: { value: CaseMode; label: string }[] = [
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
  { value: 'title', label: 'Title Case' },
  { value: 'sentence', label: 'Sentence case' },
  { value: 'alternating', label: 'aLtErNaTiNg' },
  { value: 'inverse', label: 'iNVERSE' },
  { value: 'camel', label: 'camelCase' },
  { value: 'pascal', label: 'PascalCase' },
  { value: 'snake', label: 'snake_case' },
  { value: 'constant', label: 'CONSTANT_CASE' },
  { value: 'kebab', label: 'kebab-case' },
  { value: 'dot', label: 'dot.case' },
];
export function CaseConverter() {
  const { ui } = useToolEnv();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<CaseMode | null>(null);
  const out = useMemo(() => (mode ? convertCase(text, mode) : ''), [text, mode]);
  return (
    <>
      <TextArea label={ui['ui.input']} value={text} onChange={setText} rows={7} mono={false} placeholder="Type or paste text…" />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Target case">
        {CASES.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={mode === c.value}
            onClick={() => setMode(c.value)}
            className={`btn-sm rounded-lg border px-3 py-1.5 font-mono text-xs ${mode === c.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:border-brand-500 dark:border-slate-700 dark:bg-slate-900'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <TextArea label={ui['ui.output']} value={out} readOnly rows={7} mono={false} />
      <Actions>
        <CopyButton text={out} />
        <ResetButton onClick={() => (setText(''), setMode(null))} />
      </Actions>
    </>
  );
}

/* ---------------------- Remove duplicate lines --------------------- */
export function RemoveDuplicateLines() {
  const { ui } = useToolEnv();
  const [text, setText] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const res = useMemo(() => removeDuplicateLines(text, { ignoreCase, trim, removeEmpty }), [text, ignoreCase, trim, removeEmpty]);
  return (
    <>
      <TextArea label={ui['ui.input']} value={text} onChange={setText} rows={9} placeholder={'apple\nbanana\napple'} />
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
        <Checkbox label="Trim spaces" checked={trim} onChange={setTrim} />
        <Checkbox label="Remove empty lines" checked={removeEmpty} onChange={setRemoveEmpty} />
      </div>
      {text && (
        <Notice tone="success">
          {res.removed} duplicate{res.removed === 1 ? '' : 's'} removed · {res.kept} unique line{res.kept === 1 ? '' : 's'} kept
        </Notice>
      )}
      <TextArea label={ui['ui.output']} value={res.text} readOnly rows={9} />
      <Actions>
        <CopyButton text={res.text} />
        <DownloadButton text={res.text} filename="unique-lines.txt" primary={false} />
        <ResetButton onClick={() => setText('')} />
      </Actions>
    </>
  );
}

/* ----------------------------- Sort lines -------------------------- */
export function SortLines() {
  const { ui } = useToolEnv();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<SortMode>('alpha');
  const [desc, setDesc] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [out, setOut] = useState('');
  const sort = () => setOut(sortLines(text, mode, { descending: desc, ignoreCase, removeEmpty }));
  return (
    <>
      <TextArea label={ui['ui.input']} value={text} onChange={setText} rows={9} placeholder={'banana\nApple\ncherry'} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select<SortMode>
          label="Sort mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'alpha', label: 'Alphabetical (A→Z)' },
            { value: 'natural', label: 'Natural / numeric (2 before 10)' },
            { value: 'length', label: 'By line length' },
            { value: 'reverse', label: 'Reverse current order' },
            { value: 'shuffle', label: 'Random shuffle' },
          ]}
        />
        <div className="flex flex-col justify-end gap-2">
          <Checkbox label="Descending" checked={desc} onChange={setDesc} />
          <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
          <Checkbox label="Remove empty lines" checked={removeEmpty} onChange={setRemoveEmpty} />
        </div>
      </div>
      <Actions>
        <button type="button" className="btn-primary" onClick={sort} disabled={!text}>
          Sort lines
        </button>
      </Actions>
      <TextArea label={ui['ui.output']} value={out} readOnly rows={9} />
      <Actions>
        <CopyButton text={out} />
        <ResetButton onClick={() => (setText(''), setOut(''))} />
      </Actions>
    </>
  );
}

/* --------------------------- Find & replace ------------------------ */
export function FindAndReplace() {
  const { ui } = useToolEnv();
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [repl, setRepl] = useState('');
  const [caseSensitive, setCase] = useState(false);
  const [wholeWord, setWhole] = useState(false);
  const [regex, setRegex] = useState(false);
  const [out, setOut] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    setError(null);
    if (!find) return setError('Enter the text to find.');
    if (!regex) {
      const r = replacePlain(text, find, repl, { caseSensitive, wholeWord });
      setOut(r.text);
      setCount(r.count);
      return;
    }
    setBusy(true);
    try {
      const pattern = wholeWord ? `\\b(?:${find})\\b` : find;
      const r = await runRegex({ mode: 'replace', pattern, flags: `g${caseSensitive ? '' : 'i'}u`, input: text, replacement: repl });
      setOut(r.output ?? '');
      setCount(r.count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <TextArea label={ui['ui.input']} value={text} onChange={setText} rows={8} mono={false} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="far-find">
            Find
          </label>
          <input id="far-find" className="input font-mono" value={find} onChange={(e) => setFind(e.target.value)} maxLength={5000} />
        </div>
        <div>
          <label className="label" htmlFor="far-repl">
            Replace with
          </label>
          <input id="far-repl" className="input font-mono" value={repl} onChange={(e) => setRepl(e.target.value)} maxLength={5000} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Checkbox label="Case sensitive" checked={caseSensitive} onChange={setCase} />
        <Checkbox label="Whole words only" checked={wholeWord} onChange={setWhole} />
        <Checkbox label="Regular expression" checked={regex} onChange={setRegex} hint={regex ? 'Use $1, $2 or $<name> for groups.' : undefined} />
      </div>
      <ErrorBox error={error} />
      <Actions>
        <button type="button" className="btn-primary" onClick={apply} disabled={busy || !text}>
          Replace all
        </button>
        {count !== null && <span className="text-sm text-slate-600 dark:text-slate-400">{count} replacement{count === 1 ? '' : 's'}</span>}
      </Actions>
      <TextArea label={ui['ui.output']} value={out} readOnly rows={8} mono={false} />
      <Actions>
        <CopyButton text={out} />
        <ResetButton onClick={() => (setText(''), setOut(''), setCount(null), setFind(''), setRepl(''))} />
      </Actions>
    </>
  );
}

/* ------------------------------ Text diff -------------------------- */
export function TextDiff() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [mode, setMode] = useState<'line' | 'word'>('line');
  const [res, setRes] = useState<ReturnType<typeof diffText> | null>(null);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea label="Original text" value={a} onChange={setA} rows={10} />
        <TextArea label="Changed text" value={b} onChange={setB} rows={10} />
      </div>
      <Actions>
        <Segmented label="Compare by" value={mode} onChange={setMode} options={[{ value: 'line', label: 'Lines' }, { value: 'word', label: 'Words' }]} />
        <button type="button" className="btn-primary" onClick={() => setRes(diffText(a, b, mode))} disabled={!a && !b}>
          Compare
        </button>
        <ResetButton onClick={() => (setA(''), setB(''), setRes(null))} />
      </Actions>
      {res && (
        <div className="space-y-3">
          {res.reduced && <Notice tone="warn">The texts are very large, so changed blocks are shown without fine-grained alignment.</Notice>}
          <p className="text-sm">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">+{res.stats.added}</span> added ·{' '}
            <span className="font-semibold text-red-700 dark:text-red-400">−{res.stats.removed}</span> removed · {res.stats.unchanged} unchanged
          </p>
          <div
            className={`max-h-[32rem] overflow-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-[13px] leading-relaxed dark:border-slate-800 dark:bg-slate-950 ${mode === 'word' ? 'whitespace-pre-wrap' : ''}`}
            aria-label="Differences"
          >
            {res.ops.length === 0 && <p className="text-slate-500">Both texts are empty.</p>}
            {res.ops.map((op, i) =>
              mode === 'line' ? (
                <div
                  key={i}
                  className={`whitespace-pre-wrap px-2 ${op.type === 'insert' ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100' : op.type === 'delete' ? 'bg-red-50 text-red-900 line-through decoration-red-400/60 dark:bg-red-950/60 dark:text-red-100' : ''}`}
                >
                  <span className="me-2 select-none text-slate-400" aria-hidden="true">
                    {op.type === 'insert' ? '+' : op.type === 'delete' ? '−' : ' '}
                  </span>
                  <span className="sr-only">{op.type === 'insert' ? 'Added: ' : op.type === 'delete' ? 'Removed: ' : ''}</span>
                  {op.value || ' '}
                </div>
              ) : op.type === 'equal' ? (
                <span key={i}>{op.value}</span>
              ) : op.type === 'insert' ? (
                <ins key={i} className="rounded bg-emerald-100 text-emerald-900 no-underline dark:bg-emerald-900/60 dark:text-emerald-100">
                  {op.value}
                </ins>
              ) : (
                <del key={i} className="rounded bg-red-100 text-red-900 dark:bg-red-900/60 dark:text-red-100">
                  {op.value}
                </del>
              ),
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* --------------------------- Slug generator ------------------------ */
export function SlugGenerator() {
  const { ui } = useToolEnv();
  const [text, setText] = useState('');
  const [separator, setSep] = useState<'-' | '_' | '.'>('-');
  const [lowercase, setLower] = useState(true);
  const [asciiOnly, setAscii] = useState(true);
  const [removeStopWords, setStop] = useState(false);
  const [maxLength, setMax] = useState<number | ''>(80);
  const out = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((l) => (l.trim() ? slugify(l, { separator, lowercase, asciiOnly, removeStopWords, maxLength: Number(maxLength) || 0 }) : ''))
        .join('\n'),
    [text, separator, lowercase, asciiOnly, removeStopWords, maxLength],
  );
  return (
    <>
      <TextArea label="Titles (one per line)" value={text} onChange={setText} rows={5} mono={false} placeholder="Crème Brûlée: 10 Easy Tips!" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Separator" value={separator} onChange={setSep} options={[{ value: '-', label: 'Hyphen (-)' }, { value: '_', label: 'Underscore (_)' }, { value: '.', label: 'Dot (.)' }]} />
        <NumberInput label="Max length (0 = none)" value={maxLength} onChange={setMax} min={0} max={500} step={1} />
        <div className="flex flex-col justify-end gap-2">
          <Checkbox label="Lowercase" checked={lowercase} onChange={setLower} />
          <Checkbox label="ASCII only" checked={asciiOnly} onChange={setAscii} />
          <Checkbox label="Remove short English stop words" checked={removeStopWords} onChange={setStop} />
        </div>
      </div>
      <TextArea label={ui['ui.output']} value={out} readOnly rows={5} />
      <Actions>
        <CopyButton text={out} />
        <ResetButton onClick={() => setText('')} />
      </Actions>
    </>
  );
}

/* ------------------------ Line number generator -------------------- */
export function LineNumberGenerator() {
  const { ui } = useToolEnv();
  const [text, setText] = useState('');
  const [start, setStart] = useState<number | ''>(1);
  const [step, setStep] = useState<number | ''>(1);
  const [pad, setPad] = useState(false);
  const [sep, setSep] = useState('. ');
  const [skipEmpty, setSkip] = useState(false);
  const out = useMemo(
    () => (text ? addLineNumbers(text, { start: Number(start) || 0, step: Number(step) || 1, pad, separator: sep, skipEmpty }) : ''),
    [text, start, step, pad, sep, skipEmpty],
  );
  return (
    <>
      <TextArea label={ui['ui.input']} value={text} onChange={setText} rows={8} />
      <div className="grid gap-4 sm:grid-cols-4">
        <NumberInput label="Start at" value={start} onChange={setStart} step={1} />
        <NumberInput label="Step" value={step} onChange={setStep} step={1} />
        <Select
          label="Separator"
          value={sep}
          onChange={setSep}
          options={[
            { value: '. ', label: '1. text' },
            { value: ') ', label: '1) text' },
            { value: ': ', label: '1: text' },
            { value: '\t', label: '1⇥text (tab)' },
            { value: ' ', label: '1 text' },
            { value: ' | ', label: '1 | text' },
          ]}
        />
        <div className="flex flex-col justify-end gap-2">
          <Checkbox label="Zero padding" checked={pad} onChange={setPad} />
          <Checkbox label="Skip empty lines" checked={skipEmpty} onChange={setSkip} />
        </div>
      </div>
      <TextArea label={ui['ui.output']} value={out} readOnly rows={8} />
      <Actions>
        <CopyButton text={out} />
        <DownloadButton text={out} filename="numbered.txt" primary={false} />
        <ResetButton onClick={() => setText('')} />
      </Actions>
    </>
  );
}
