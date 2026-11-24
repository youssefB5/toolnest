import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, Copy, Download, FileText, Loader2, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import type { Locale } from '../../types/tool';
import type { ToolUi } from './ui-keys';
import { copyText, downloadBlob, downloadText, zipAndDownload } from '../../lib/file-processing/download';
import { formatBytes } from '../../lib/file-processing/format';
import { FileValidationError, validateFile, type ValidatedFile } from '../../lib/file-processing/validate';
import type { DetectedType } from '../../lib/file-processing/detect';

export interface ToolEnv {
  locale: Locale;
  ui: ToolUi;
  maxBytes: number;
}

export const ToolEnvContext = createContext<ToolEnv>({
  locale: 'en',
  ui: {} as ToolUi,
  maxBytes: 50 * 1024 * 1024,
});
export const useToolEnv = () => useContext(ToolEnvContext);

/* ------------------------------------------------------------------ */
/* Basic UI                                                            */
/* ------------------------------------------------------------------ */

export function ErrorBox({ error, onClose }: { error: string | null; onClose?: () => void }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 whitespace-pre-line">{error}</p>
      {onClose && (
        <button type="button" onClick={onClose} className="rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900" aria-label="Dismiss">
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'success' }) {
  const cls =
    tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
        : 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100';
  return <div className={`rounded-lg border p-3 text-sm ${cls}`}>{children}</div>;
}

export function Progress({ value, label }: { value: number | null; label?: string }) {
  const { ui } = useToolEnv();
  return (
    <div className="space-y-1.5" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {label ?? ui['ui.processing']}
        {value !== null && <span className="ms-auto tabular-nums">{Math.round(value * 100)}%</span>}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value !== null ? Math.round(value * 100) : undefined}
      >
        <div
          className={`h-full rounded-full bg-brand-600 transition-[width] duration-200 ${value === null ? 'w-1/3 animate-pulse' : ''}`}
          style={value !== null ? { width: `${Math.max(2, value * 100)}%` } : undefined}
        />
      </div>
    </div>
  );
}

export function CopyButton({ text, className = '', label }: { text: string; className?: string; label?: string }) {
  const { ui } = useToolEnv();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn-secondary btn-sm ${className}`}
      disabled={!text}
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }
      }}
    >
      {done ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      <span aria-live="polite">{done ? ui['ui.copied'] : (label ?? ui['ui.copy'])}</span>
    </button>
  );
}

export function DownloadButton({
  blob,
  text,
  filename,
  mime,
  label,
  primary = true,
}: {
  blob?: Blob | null;
  text?: string;
  filename: string;
  mime?: string;
  label?: string;
  primary?: boolean;
}) {
  const { ui } = useToolEnv();
  const disabled = !blob && !text;
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${primary ? 'btn-primary' : 'btn-secondary'} btn-sm`}
      onClick={() => {
        if (blob) downloadBlob(blob, filename);
        else if (text !== undefined) downloadText(text, filename, mime);
      }}
    >
      <Download className="size-4" aria-hidden="true" />
      {label ?? ui['ui.download']}
    </button>
  );
}

export function ZipButton({ files, zipName }: { files: { name: string; blob: Blob }[]; zipName: string }) {
  const { ui } = useToolEnv();
  const [busy, setBusy] = useState(false);
  if (files.length < 2) return null;
  return (
    <button
      type="button"
      className="btn-secondary btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await zipAndDownload(files, zipName);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
      {ui['ui.downloadAll']}
    </button>
  );
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  const { ui } = useToolEnv();
  return (
    <button type="button" className="btn-ghost btn-sm" onClick={onClick}>
      <RotateCcw className="size-4" aria-hidden="true" />
      {ui['ui.reset']}
    </button>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  hint,
}: {
  label: string;
  value: number | '';
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  suffix?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className={`input ${suffix ? 'pe-12' : ''}`}
          value={value}
          min={min}
          max={max}
          step={step ?? 'any'}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        {suffix && <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>}
      </div>
    </Field>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input id={id} type="checkbox" className="mt-0.5 size-4 rounded border-slate-300 accent-[var(--brand)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id} className="text-sm text-slate-700 dark:text-slate-300">
        {label}
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </label>
    </div>
  );
}

export function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <output htmlFor={id} className="text-sm tabular-nums text-slate-600 dark:text-slate-400">
          {format ? format(value) : value}
        </output>
      </div>
      <input id={id} type="range" className="w-full accent-[var(--brand)]" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 10,
  readOnly,
  mono = true,
  maxLength = 5_000_000,
  dirAuto = true,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  mono?: boolean;
  maxLength?: number;
  dirAuto?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id}>
      <textarea
        id={id}
        className={`textarea ${mono ? '' : 'font-sans text-sm'}`}
        rows={rows}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        maxLength={maxLength}
        spellCheck={false}
        dir={dirAuto ? 'auto' : undefined}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Field>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${value === o.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* File input                                                          */
/* ------------------------------------------------------------------ */

export interface FileDropProps {
  accept: DetectedType[];
  acceptAttr: string; // input accept attribute e.g. "image/*"
  acceptLabel: string;
  multiple?: boolean;
  onFiles: (files: ValidatedFile[]) => void;
  onError: (msg: string) => void;
  maxFiles?: number;
  compact?: boolean;
}

export function FileDrop({ accept, acceptAttr, acceptLabel, multiple = false, onFiles, onError, maxFiles = 50, compact }: FileDropProps) {
  const { ui, maxBytes } = useToolEnv();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const descId = useId();

  const handle = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list).slice(0, multiple ? maxFiles : 1);
      if (!files.length) return;
      setBusy(true);
      const ok: ValidatedFile[] = [];
      const errors: string[] = [];
      for (const f of files) {
        try {
          ok.push(await validateFile(f, { maxBytes, accept, acceptLabel }));
        } catch (e) {
          errors.push(e instanceof FileValidationError ? e.message : `Could not read “${f.name}”.`);
        }
      }
      if (Array.from(list).length > files.length) errors.push(`Only ${multiple ? maxFiles : 1} file(s) can be added at once.`);
      setBusy(false);
      if (errors.length) onError(errors.join('\n'));
      if (ok.length) onFiles(ok);
    },
    [accept, acceptLabel, maxBytes, maxFiles, multiple, onError, onFiles],
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors ${compact ? 'p-4' : 'p-8 sm:p-10'} ${over ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/10' : 'border-slate-300 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-950/40'}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files?.length) handle(e.dataTransfer.files);
      }}
    >
      {!compact && <Upload className="mb-3 size-8 text-brand-600" aria-hidden="true" />}
      <p className="text-sm text-slate-600 dark:text-slate-300">{ui['ui.dropHere']}</p>
      <button type="button" className="btn-primary mt-3" onClick={() => inputRef.current?.click()} aria-describedby={descId} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
        {multiple ? ui['ui.selectFiles'] : ui['ui.selectFile']}
      </button>
      <p id={descId} className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {acceptLabel} · {ui['ui.maxSize'].replace('{size}', formatBytes(maxBytes, 0))}
      </p>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept={acceptAttr}
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files) handle(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** Creates an object URL for a blob and revokes it automatically. */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

export function FileRow({
  file,
  onRemove,
  extra,
  thumb,
}: {
  file: { name: string; size: number; type: string };
  onRemove?: () => void;
  extra?: ReactNode;
  thumb?: Blob | null;
}) {
  const { ui } = useToolEnv();
  const url = useObjectUrl(thumb);
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950">
      {url ? (
        <img src={url} alt="" className="size-11 shrink-0 rounded-md object-cover checker-bg" />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
          <FileText className="size-5 text-slate-500" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatBytes(file.size)} · {file.type.replace('image/', '').replace('application/', '').toUpperCase()}
        </p>
      </div>
      {extra}
      {onRemove && (
        <button type="button" onClick={onRemove} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" aria-label={`${ui['ui.remove']} ${file.name}`}>
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

/** Small hook for async operations with progress + error handling. */
export function useTask() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T,>(fn: (report: (p: number) => void) => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      return await fn((p) => setProgress(Math.min(1, Math.max(0, p))));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(/memory|allocation|RangeError/i.test(msg) ? `Your device ran out of memory for this file. Try a smaller file or close other tabs.\n(${msg})` : msg);
      return undefined;
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, []);
  return { busy, progress, error, setError, run };
}
