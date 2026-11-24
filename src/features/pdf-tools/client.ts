/**
 * Main-thread client for the pdf-lib Web Worker. Falls back to running the
 * operation on the main thread if Workers are unavailable.
 */
type Op = 'merge' | 'split' | 'extract' | 'reorder' | 'rotate' | 'images' | 'numbers' | 'watermark' | 'compress' | 'info' | 'count';

let worker: Worker | null = null;
let seq = 0;
let idle: ReturnType<typeof setTimeout> | null = null;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; progress?: (p: number) => void }>();

function getWorker() {
  if (idle) clearTimeout(idle);
  if (!worker) {
    worker = new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; ok?: boolean; result?: unknown; error?: string; progress?: number }>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      if (typeof e.data.progress === 'number') return p.progress?.(e.data.progress);
      pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data.result);
      else p.reject(new Error(e.data.error || 'PDF processing failed.'));
      idle = setTimeout(() => {
        if (!pending.size) {
          worker?.terminate();
          worker = null;
        }
      }, 30_000);
    };
    worker.onerror = (e) => {
      for (const p of pending.values()) p.reject(new Error(e.message || 'The PDF worker crashed (the file may be too large for this device).'));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

export async function runPdf<T>(op: Op, args: unknown[], progress?: (p: number) => void): Promise<T> {
  if (typeof Worker === 'undefined') {
    const ops = await import('./logic');
    const map: Record<Op, (...a: never[]) => Promise<unknown>> = {
      merge: ops.mergePdfs as never,
      split: ops.splitPdf as never,
      extract: ops.extractPages as never,
      reorder: ops.reorderPages as never,
      rotate: ops.rotatePages as never,
      images: ops.imagesToPdf as never,
      numbers: ops.addPageNumbers as never,
      watermark: ops.addWatermark as never,
      compress: ops.compressLossless as never,
      info: ops.getPdfInfo as never,
      count: ops.pageCount as never,
    };
    return (await (map[op] as (...a: unknown[]) => Promise<unknown>)(...args, progress)) as T;
  }
  const w = getWorker();
  const id = ++seq;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, progress });
    w.postMessage({ id, op, args });
  });
}

export const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: 'application/pdf' });
