import { useCallback, useState, type ReactNode } from 'react';
import { Download } from 'lucide-react';
import { Actions, ErrorBox, FileDrop, FileRow, Progress, ResetButton, ZipButton, useObjectUrl, useTask, useToolEnv } from '../../components/tools/kit';
import { RASTER_IMAGE_TYPES, type DetectedType } from '../../lib/file-processing/detect';
import { downloadBlob } from '../../lib/file-processing/download';
import { formatBytes, savedPercent } from '../../lib/file-processing/format';
import type { ValidatedFile } from '../../lib/file-processing/validate';

export const IMAGE_ACCEPT: DetectedType[] = RASTER_IMAGE_TYPES;
export const IMAGE_ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,image/x-icon';
export const IMAGE_ACCEPT_LABEL = 'JPG, PNG, WebP, GIF, BMP or AVIF';

export interface ImageResult {
  id: string;
  name: string;
  blob: Blob;
  originalSize: number;
  note?: string;
}

/**
 * Generic multi-image tool: select files → options → process each → results with
 * before/after sizes, per-file download and ZIP. Used by the compressor,
 * converter and metadata remover.
 */
export function BatchImageTool({
  options,
  actionLabel,
  process,
  zipName,
  showSavings = true,
}: {
  options: ReactNode;
  actionLabel: string;
  process: (f: ValidatedFile) => Promise<ImageResult>;
  zipName: string;
  showSavings?: boolean;
}) {
  const [files, setFiles] = useState<ValidatedFile[]>([]);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [done, setDone] = useState(0);
  const { busy, error, setError, run } = useTask();

  const onFiles = useCallback((list: ValidatedFile[]) => {
    setFiles((f) => [...f, ...list].slice(0, 50));
    setResults([]);
  }, []);

  const start = () =>
    run(async (report) => {
      const out: ImageResult[] = [];
      const errors: string[] = [];
      setDone(0);
      for (let i = 0; i < files.length; i++) {
        try {
          out.push(await process(files[i]));
        } catch (e) {
          errors.push(`${files[i].name}: ${e instanceof Error ? e.message : e}`);
        }
        setDone(i + 1);
        report((i + 1) / files.length);
      }
      setResults(out);
      if (errors.length) setError(errors.join('\n'));
    });

  const total = results.reduce((s, r) => s + r.originalSize, 0);
  const totalAfter = results.reduce((s, r) => s + r.blob.size, 0);

  return (
    <>
      <FileDrop multiple accept={IMAGE_ACCEPT} acceptAttr={IMAGE_ACCEPT_ATTR} acceptLabel={IMAGE_ACCEPT_LABEL} onFiles={onFiles} onError={setError} />
      <ErrorBox error={error} onClose={() => setError(null)} />
      {files.length > 0 && (
        <>
          <ul className="space-y-2" aria-label="Selected files">
            {files.map((f) => (
              <FileRow key={f.id} file={f} thumb={f.file} onRemove={busy ? undefined : () => (setFiles((x) => x.filter((y) => y.id !== f.id)), setResults([]))} />
            ))}
          </ul>
          <div className="grid gap-4 sm:grid-cols-2">{options}</div>
          <Actions>
            <button type="button" className="btn-primary" onClick={start} disabled={busy || !files.length}>
              {actionLabel}
            </button>
            <ResetButton onClick={() => (setFiles([]), setResults([]), setError(null))} />
          </Actions>
        </>
      )}
      {busy && <Progress value={files.length ? done / files.length : null} label={`Processing ${done} / ${files.length}…`} />}
      {results.length > 0 && (
        <section aria-label="Results" className="space-y-3">
          {showSavings && results.length > 1 && (
            <p className="text-sm">
              Total: {formatBytes(total)} → <strong>{formatBytes(totalAfter)}</strong> ({savedPercent(total, totalAfter)}% saved)
            </p>
          )}
          <ul className="space-y-2">
            {results.map((r) => (
              <ResultRow key={r.id} r={r} showSavings={showSavings} />
            ))}
          </ul>
          <ZipButton files={results.map((r) => ({ name: r.name, blob: r.blob }))} zipName={zipName} />
        </section>
      )}
    </>
  );
}

function ResultRow({ r, showSavings }: { r: ImageResult; showSavings: boolean }) {
  const { ui } = useToolEnv();
  const url = useObjectUrl(r.blob);
  const pct = savedPercent(r.originalSize, r.blob.size);
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950">
      {url && <img src={url} alt="" className="checker-bg size-12 rounded-md object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{r.name}</p>
        <p className="text-xs text-slate-500">
          {showSavings ? (
            <>
              {formatBytes(r.originalSize)} → <strong className="text-slate-800 dark:text-slate-200">{formatBytes(r.blob.size)}</strong>{' '}
              <span className={pct >= 0 ? 'text-emerald-600' : 'text-amber-600'}>({pct >= 0 ? `−${pct}` : `+${Math.abs(pct)}`}%)</span>
            </>
          ) : (
            formatBytes(r.blob.size)
          )}
          {r.note && <span className="block text-amber-700 dark:text-amber-400">{r.note}</span>}
        </p>
      </div>
      <button type="button" className="btn-primary btn-sm" onClick={() => downloadBlob(r.blob, r.name)}>
        <Download className="size-4" aria-hidden="true" /> {ui['ui.download']}
      </button>
    </li>
  );
}

/** Single-image picker with preview, used by resizer/cropper/rotator etc. */
export function useSingleImage() {
  const [file, setFile] = useState<ValidatedFile | null>(null);
  const { busy, error, setError, run, progress } = useTask();
  return { file, setFile, busy, error, setError, run, progress };
}

export function SingleImagePicker({
  onFile,
  onError,
  accept = IMAGE_ACCEPT,
  acceptAttr = IMAGE_ACCEPT_ATTR,
  acceptLabel = IMAGE_ACCEPT_LABEL,
}: {
  onFile: (f: ValidatedFile) => void;
  onError: (e: string) => void;
  accept?: DetectedType[];
  acceptAttr?: string;
  acceptLabel?: string;
}) {
  return <FileDrop accept={accept} acceptAttr={acceptAttr} acceptLabel={acceptLabel} onFiles={([f]) => onFile(f)} onError={onError} />;
}

export function outputMimeFor(type: DetectedType): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (type === 'image/jpeg') return 'image/jpeg';
  if (type === 'image/webp') return 'image/webp';
  return 'image/png';
}
