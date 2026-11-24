import { renderImage } from './image-render';
import type { ImageOps } from './image-geometry';

/**
 * Client-side image processing with a Web Worker (OffscreenCanvas) when supported,
 * falling back to the main thread. The worker is created lazily and terminated
 * after a period of inactivity to free memory.
 */
let worker: Worker | null = null;
let seq = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
const pending = new Map<number, { resolve: (b: Blob) => void; reject: (e: Error) => void }>();

const supportsWorker = () =>
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined' &&
  'convertToBlob' in OffscreenCanvas.prototype;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../../workers/image.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; ok: boolean; blob?: Blob; error?: string }>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.ok && e.data.blob) p.resolve(e.data.blob);
      else p.reject(new Error(e.data.error || 'Image processing failed.'));
      scheduleIdle();
    };
    worker.onerror = (e) => {
      for (const p of pending.values()) p.reject(new Error(e.message || 'Image worker crashed.'));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  if (idleTimer) clearTimeout(idleTimer);
  return worker;
}

function scheduleIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (pending.size === 0 && worker) {
      worker.terminate();
      worker = null;
    }
  }, 30_000);
}

export function loadHtmlImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This image could not be decoded by your browser.'));
    };
    img.src = url;
  });
}

async function mainThread(blob: Blob, ops: ImageOps): Promise<Blob> {
  const img = await loadHtmlImage(blob);
  const out = await renderImage(img, ops, (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  });
  if (out.type !== ops.mime) throw new Error(`Your browser cannot encode ${ops.mime.replace('image/', '').toUpperCase()}.`);
  return out;
}

export async function processImage(blob: Blob, ops: ImageOps): Promise<Blob> {
  // SVG cannot be decoded by createImageBitmap in workers; use the main thread.
  if (supportsWorker() && blob.type !== 'image/svg+xml') {
    try {
      const w = getWorker();
      const id = ++seq;
      return await new Promise<Blob>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        w.postMessage({ id, blob, ops });
      });
    } catch (e) {
      // Some browsers can't decode certain formats in workers: retry on the main thread.
      if (e instanceof Error && /encode/.test(e.message)) throw e;
    }
  }
  return mainThread(blob, ops);
}

export async function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap !== 'undefined' && blob.type !== 'image/svg+xml') {
    try {
      const b = await createImageBitmap(blob);
      const s = { width: b.width, height: b.height };
      b.close();
      return s;
    } catch {
      /* fall through */
    }
  }
  const img = await loadHtmlImage(blob);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

const encodeCache = new Map<string, boolean>();
export async function canEncode(mime: string): Promise<boolean> {
  if (encodeCache.has(mime)) return encodeCache.get(mime)!;
  const c = document.createElement('canvas');
  c.width = c.height = 2;
  const ok = await new Promise<boolean>((r) => c.toBlob((b) => r(!!b && b.type === mime), mime, 0.8));
  encodeCache.set(mime, ok);
  return ok;
}
