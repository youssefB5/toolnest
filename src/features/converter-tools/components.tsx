import { useMemo, useState } from 'react';
import {
  Actions,
  Checkbox,
  CopyButton,
  DownloadButton,
  ErrorBox,
  FileDrop,
  Notice,
  NumberInput,
  ResetButton,
  Select,
  TextArea,
  useToolEnv,
} from '../../components/tools/kit';
import {
  contrastRatio,
  convertUnit,
  csvToJson,
  detectDelimiter,
  formatNumber,
  fromCelsius,
  jsonToCsv,
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  round,
  SIZE_UNITS,
  toBytes,
  toCelsius,
  UNIT_CATEGORIES,
  type TempUnit,
} from './logic';

async function readText(file: File) {
  return await file.text();
}

/* ---------------------------- CSV → JSON ---------------------------- */
export function CsvToJson() {
  const { ui } = useToolEnv();
  const [input, setInput] = useState('');
  const [delim, setDelim] = useState<'auto' | ',' | ';' | '\t' | '|'>('auto');
  const [header, setHeader] = useState(true);
  const [types, setTypes] = useState(true);
  const [out, setOut] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const convert = () => {
    try {
      const d = delim === 'auto' ? detectDelimiter(input) : delim;
      const res = csvToJson(input, { delimiter: d, header, parseTypes: types });
      setOut(JSON.stringify(res, null, 2));
      setCount(res.length);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOut('');
    }
  };
  return (
    <>
      <FileDrop
        compact
        accept={['text/plain']}
        acceptAttr=".csv,.tsv,.txt,text/csv"
        acceptLabel="CSV / TSV text file"
        onError={setError}
        onFiles={async ([f]) => setInput(await readText(f.file))}
      />
      <TextArea label={ui['ui.input']} value={input} onChange={setInput} rows={9} placeholder={'name,age,city\nAlice,30,Paris\nBob,25,"New York, NY"'} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Delimiter"
          value={delim}
          onChange={setDelim}
          options={[
            { value: 'auto', label: 'Auto-detect' },
            { value: ',', label: 'Comma (,)' },
            { value: ';', label: 'Semicolon (;)' },
            { value: '\t', label: 'Tab' },
            { value: '|', label: 'Pipe (|)' },
          ]}
        />
        <div className="flex flex-col justify-end gap-2 sm:col-span-2">
          <Checkbox label="First row contains headers" checked={header} onChange={setHeader} />
          <Checkbox label="Convert numbers, booleans and null" checked={types} onChange={setTypes} />
        </div>
      </div>
      <Actions>
        <button type="button" className="btn-primary" onClick={convert} disabled={!input.trim()}>
          Convert to JSON
        </button>
        {count !== null && <span className="text-sm text-slate-600">{count} records</span>}
      </Actions>
      <ErrorBox error={error} />
      <TextArea label={ui['ui.output']} value={out} readOnly rows={10} />
      <Actions>
        <CopyButton text={out} />
        <DownloadButton text={out} filename="data.json" mime="application/json" primary={false} />
        <ResetButton onClick={() => (setInput(''), setOut(''), setCount(null), setError(null))} />
      </Actions>
    </>
  );
}

/* ---------------------------- JSON → CSV ---------------------------- */
export function JsonToCsv() {
  const { ui } = useToolEnv();
  const [input, setInput] = useState('');
  const [delim, setDelim] = useState<',' | ';' | '\t'>(',');
  const [protect, setProtect] = useState(true);
  const [bom, setBom] = useState(true);
  const [out, setOut] = useState('');
  const [error, setError] = useState<string | null>(null);
  const convert = () => {
    try {
      const data = JSON.parse(input);
      if (data === null || typeof data !== 'object') throw new Error('The JSON must be an array of objects or an object.');
      setOut(jsonToCsv(data, { delimiter: delim, protectFormulas: protect, bom }));
      setError(null);
    } catch (e) {
      setError(e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : e instanceof Error ? e.message : String(e));
      setOut('');
    }
  };
  return (
    <>
      <FileDrop compact accept={['text/plain']} acceptAttr=".json,application/json" acceptLabel="JSON file" onError={setError} onFiles={async ([f]) => setInput(await readText(f.file))} />
      <TextArea label={ui['ui.input']} value={input} onChange={setInput} rows={9} placeholder='[{"name":"Alice","address":{"city":"Paris"}}]' />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Delimiter" value={delim} onChange={setDelim} options={[{ value: ',', label: 'Comma (,)' }, { value: ';', label: 'Semicolon (;) — Excel in FR/DE' }, { value: '\t', label: 'Tab' }]} />
        <div className="flex flex-col justify-end gap-2 sm:col-span-2">
          <Checkbox label="Protect against formula injection (=, +, -, @)" checked={protect} onChange={setProtect} />
          <Checkbox label="Add UTF-8 BOM (helps Excel show accents)" checked={bom} onChange={setBom} />
        </div>
      </div>
      <Actions>
        <button type="button" className="btn-primary" onClick={convert} disabled={!input.trim()}>
          Convert to CSV
        </button>
      </Actions>
      <ErrorBox error={error} />
      <TextArea label={ui['ui.output']} value={out.replace(/^\uFEFF/, '')} readOnly rows={10} />
      <Actions>
        <CopyButton text={out.replace(/^\uFEFF/, '')} />
        <DownloadButton text={out} filename="data.csv" mime="text/csv;charset=utf-8" primary={false} />
        <ResetButton onClick={() => (setInput(''), setOut(''), setError(null))} />
      </Actions>
    </>
  );
}

/* ---------------------------- Unit converter ------------------------ */
export function UnitConverter() {
  const [cat, setCat] = useState('length');
  const units = UNIT_CATEGORIES[cat].units;
  const [from, setFrom] = useState('km');
  const [to, setTo] = useState('mi');
  const [value, setValue] = useState<number | ''>(1);
  const safeFrom = units.some((u) => u.id === from) ? from : units[0].id;
  const safeTo = units.some((u) => u.id === to) ? to : units[1].id;
  const result = value === '' ? null : convertUnit(Number(value), cat, safeFrom, safeTo);
  return (
    <>
      <Select
        label="Category"
        value={cat}
        onChange={(c) => {
          setCat(c);
          setFrom(UNIT_CATEGORIES[c].units[0].id);
          setTo(UNIT_CATEGORIES[c].units[1].id);
        }}
        options={Object.entries(UNIT_CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }))}
      />
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto_1fr]">
        <NumberInput label="Value" value={value} onChange={setValue} />
        <Select label="From" value={safeFrom} onChange={setFrom} options={units.map((u) => ({ value: u.id, label: u.label }))} />
        <button type="button" className="btn-ghost mb-0.5" onClick={() => (setFrom(safeTo), setTo(safeFrom))} aria-label="Swap units">
          ⇄
        </button>
        <Select label="To" value={safeTo} onChange={setTo} options={units.map((u) => ({ value: u.id, label: u.label }))} />
      </div>
      {result !== null && (
        <div className="rounded-xl bg-brand-50 p-5 text-center dark:bg-brand-700/15" aria-live="polite">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {formatNumber(Number(value))} {safeFrom} =
          </div>
          <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {formatNumber(result)} {safeTo}
          </div>
        </div>
      )}
      {value !== '' && (
        <table className="w-full text-sm">
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                <th className="py-1.5 text-start font-medium">{u.label}</th>
                <td className="py-1.5 text-end font-mono tabular-nums">{formatNumber(convertUnit(Number(value), cat, safeFrom, u.id))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ------------------------- Temperature converter -------------------- */
const TEMPS: { u: TempUnit; label: string }[] = [
  { u: 'C', label: 'Celsius (°C)' },
  { u: 'F', label: 'Fahrenheit (°F)' },
  { u: 'K', label: 'Kelvin (K)' },
  { u: 'R', label: 'Rankine (°R)' },
];
export function TemperatureConverter() {
  const [c, setC] = useState<number | null>(20);
  const [edit, setEdit] = useState<{ u: TempUnit; raw: string } | null>(null);
  const belowZero = c !== null && c < -273.15;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {TEMPS.map(({ u, label }) => (
          <div key={u}>
            <label className="label" htmlFor={`t-${u}`}>
              {label}
            </label>
            <input
              id={`t-${u}`}
              className="input text-lg"
              inputMode="decimal"
              value={edit?.u === u ? edit.raw : c === null ? '' : String(round(fromCelsius(c, u), 2))}
              onChange={(e) => {
                const raw = e.target.value;
                setEdit({ u, raw });
                const n = Number(raw.replace(',', '.'));
                setC(raw.trim() === '' || !Number.isFinite(n) ? null : toCelsius(n, u));
              }}
              onBlur={() => setEdit(null)}
            />
          </div>
        ))}
      </div>
      {belowZero && <ErrorBox error="This is below absolute zero (−273.15 °C / 0 K), which is physically impossible." />}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500">
            <th className="py-1 text-start font-medium">Reference</th>
            <th className="py-1 text-end font-medium">°C</th>
            <th className="py-1 text-end font-medium">°F</th>
            <th className="py-1 text-end font-medium">K</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Water freezes', 0],
            ['Room temperature', 20],
            ['Body temperature', 37],
            ['Water boils (sea level)', 100],
            ['Oven (moderate)', 180],
          ].map(([name, cel]) => (
            <tr key={String(name)} className="border-t border-slate-100 dark:border-slate-800">
              <td className="py-1.5">{name}</td>
              <td className="py-1.5 text-end tabular-nums">{cel}</td>
              <td className="py-1.5 text-end tabular-nums">{round(fromCelsius(Number(cel), 'F'), 1)}</td>
              <td className="py-1.5 text-end tabular-nums">{round(fromCelsius(Number(cel), 'K'), 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* --------------------------- File size converter -------------------- */
export function FileSizeConverter() {
  const [value, setValue] = useState<number | ''>(1);
  const [unit, setUnit] = useState('GB');
  const bytes = value === '' ? null : toBytes(Number(value), unit);
  const all = [...SIZE_UNITS.decimal, ...SIZE_UNITS.binary.slice(1)];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberInput label="Value" value={value} onChange={setValue} min={0} />
        <Select label="Unit" value={unit} onChange={setUnit} options={all.map(([u]) => ({ value: u, label: u }))} />
      </div>
      {bytes !== null && (
        <div className="grid gap-6 sm:grid-cols-2">
          {(['decimal', 'binary'] as const).map((kind) => (
            <div key={kind}>
              <h3 className="mb-2 text-sm font-semibold">{kind === 'decimal' ? 'Decimal (SI, 1 KB = 1000 B)' : 'Binary (IEC, 1 KiB = 1024 B)'}</h3>
              <table className="w-full text-sm">
                <tbody>
                  {SIZE_UNITS[kind].map(([u, f]) => (
                    <tr key={u} className="border-t border-slate-100 dark:border-slate-800">
                      <th className="py-1.5 text-start font-medium">{u}</th>
                      <td className="py-1.5 text-end font-mono tabular-nums">{formatNumber(bytes / f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ----------------------------- Color converter ---------------------- */
export function ColorConverter() {
  const [input, setInput] = useState('#2563eb');
  const rgb = useMemo(() => parseColor(input), [input]);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const rows = rgb
    ? (() => {
        const hsl = rgbToHsl(rgb);
        const hsv = rgbToHsv(rgb);
        return [
          ['HEX', rgbToHex(rgb)],
          ['RGB', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
          ['HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
          ['HSV', `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`],
          ['CSS variable', `--color: ${rgbToHex(rgb)};`],
        ];
      })()
    : [];
  const level = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA (large text)' : 'Fail');
  return (
    <>
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="label" htmlFor="cc-in">
            Color (HEX, rgb(), hsl())
          </label>
          <input id="cc-in" className="input font-mono" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cc-pick">
            Picker
          </label>
          <input id="cc-pick" type="color" className="h-10 w-20 cursor-pointer rounded-lg border border-slate-300" value={rgb ? rgbToHex(rgb) : '#000000'} onChange={(e) => setInput(e.target.value)} />
        </div>
      </div>
      {!rgb && input && <ErrorBox error="Unrecognized color. Examples: #1e90ff, rgb(30,144,255), hsl(210, 100%, 56%)." />}
      {rgb && (
        <>
          <div className="h-24 rounded-xl border border-slate-200 dark:border-slate-700" style={{ background: rgbToHex(rgb) }} aria-hidden="true" />
          <ul className="space-y-2">
            {rows.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span className="w-24 text-sm font-medium">{k}</span>
                <code className="flex-1 font-mono text-sm">{v}</code>
                <CopyButton text={v} />
              </li>
            ))}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['On white', white],
              ['On black', black],
            ].map(([name, bg]) => {
              const r = contrastRatio(rgb, bg as typeof white);
              return (
                <div key={String(name)} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="rounded-md p-3 text-center font-semibold" style={{ background: rgbToHex(bg as typeof white), color: rgbToHex(rgb) }}>
                    Sample text
                  </div>
                  <p className="mt-2 text-sm">
                    {String(name)}: <strong>{r.toFixed(2)}:1</strong> — {level(r)}
                  </p>
                </div>
              );
            })}
          </div>
          <Notice>WCAG 2.2 AA requires 4.5:1 for body text and 3:1 for large text (≥ 24 px, or 18.66 px bold).</Notice>
        </>
      )}
    </>
  );
}
