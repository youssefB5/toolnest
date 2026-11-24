/**
 * Lazy PDF.js loader (rendering thumbnails / rasterizing pages).
 * Static assets (wasm decoders, standard fonts, CMaps) are copied to /pdfjs/
 * by scripts/copy-pdfjs-assets.mjs so nothing is fetched from a third-party CDN.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';

let lib: Promise<typeof import('pdfjs-dist')> | null = null;

export function loadPdfJs() {
  lib ??= (async () => {
    const [pdfjs, workerUrl] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
    return pdfjs;
  })();
  return lib;
}

export async function openPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  try {
    return await pdfjs.getDocument({
      data: new Uint8Array(data.slice(0)),
      enableXfa: false,
      wasmUrl: '/pdfjs/wasm/',
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
    }).promise;
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === 'PasswordException') throw new Error('This PDF is password-protected. It cannot be opened here, and we do not bypass document protection.', { cause: e });
    if (name === 'InvalidPDFException') throw new Error('This file is not a valid PDF or is corrupted.', { cause: e });
    throw e;
  }
}

export async function renderPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  opts: { scale?: number; maxSide?: number; background?: string } = {},
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  let scale = opts.scale ?? 1;
  if (opts.maxSide) scale = Math.min(scale, opts.maxSide / Math.max(base.width, base.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = opts.background ?? '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  page.cleanup();
  return canvas;
}

export const canvasToBlob = (c: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed'))), type, quality));
