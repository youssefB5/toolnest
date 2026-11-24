import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { DownloadButton, ErrorBox, FileDrop, FileRow, Progress, useTask } from '../../components/tools/kit';
import { formatBytes, savedPercent } from '../../lib/file-processing/format';
import type { ValidatedFile } from '../../lib/file-processing/validate';
import { runPdf } from './client';
import { openPdf, renderPage } from './pdfjs';

export const PDF_ACCEPT = { accept: ['application/pdf' as const], acceptAttr: 'application/pdf,.pdf', acceptLabel: 'PDF documents' };

export interface LoadedPdf {
  file: ValidatedFile;
  bytes: ArrayBuffer;
  pages: number;
}

/** Select one PDF, read it and count its pages (validating it is not encrypted/corrupt). */
export function usePdf() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const task = useTask();
  const select = useCallback(
    (f: ValidatedFile) =>
      task.run(async () => {
        const bytes = await f.file.arrayBuffer();
        const pages = await runPdf<number>('count', [bytes.slice(0), `“${f.name}”`]);
        setPdf({ file: f, bytes, pages });
      }),
    [task],
  );
  return { pdf, setPdf, select, ...task };
}

export function SinglePdfInput({ state, children }: { state: ReturnType<typeof usePdf>; children?: ReactNode }) {
  const { pdf, setPdf, select, busy, error, setError, progress } = state;
  return (
    <>
      {!pdf && <FileDrop {...PDF_ACCEPT} onFiles={([f]) => select(f)} onError={setError} />}
      <ErrorBox error={error} onClose={() => setError(null)} />
      {pdf && (
        <ul>
          <FileRow file={pdf.file} onRemove={busy ? undefined : () => setPdf(null)} extra={<span className="text-xs whitespace-nowrap text-slate-500">{pdf.pages} pages</span>} />
        </ul>
      )}
      {pdf && children}
      {busy && <Progress value={progress} />}
    </>
  );
}

export function PdfResult({ bytes, name, originalSize }: { bytes: Uint8Array; name: string; originalSize?: number }) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40" role="status">
      <p className="flex-1 text-sm">
        <strong>{name}</strong> · {formatBytes(bytes.length)}
        {originalSize !== undefined && <span className="ms-1 text-slate-600 dark:text-slate-400">(original {formatBytes(originalSize)}, {savedPercent(originalSize, bytes.length)}% smaller)</span>}
      </p>
      <DownloadButton blob={blob} filename={name} />
    </div>
  );
}

/** Lazily renders page thumbnails with PDF.js. */
export function usePdfJsDoc(bytes: ArrayBuffer | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let d: PDFDocumentProxy | null = null;
    setDoc(null);
    if (!bytes) return;
    openPdf(bytes)
      .then((x) => {
        d = x;
        if (cancelled) x.loadingTask.destroy();
        else setDoc(x);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
      d?.loadingTask.destroy();
    };
  }, [bytes]);
  return { doc, error };
}

export function Thumb({ doc, page, label, selected, onClick, children }: { doc: PDFDocumentProxy; page: number; label: string; selected?: boolean; onClick?: () => void; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || done) return;
        done = true;
        io.disconnect();
        try {
          const c = await renderPage(doc, page, { scale: 1, maxSide: 220 });
          setSrc(c.toDataURL('image/jpeg', 0.75));
        } catch {
          /* leave placeholder */
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [doc, page]);
  const inner = (
    <>
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
        {src ? <img src={src} alt="" className="max-h-full max-w-full object-contain shadow-sm" /> : <span className="text-xs text-slate-400">{page}</span>}
      </div>
      <span className="mt-1 block text-center text-xs">{label}</span>
    </>
  );
  return (
    <div ref={ref} className={`relative rounded-lg border-2 p-1.5 ${selected ? 'border-brand-600 bg-brand-50 dark:bg-brand-700/20' : 'border-transparent'}`}>
      {onClick ? (
        <button type="button" onClick={onClick} aria-pressed={selected} className="block w-full text-start" aria-label={label}>
          {inner}
        </button>
      ) : (
        inner
      )}
      {children}
    </div>
  );
}

export function baseName(name: string) {
  return name.replace(/\.pdf$/i, '');
}
