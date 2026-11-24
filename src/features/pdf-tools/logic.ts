import { degrees, PDFDocument, rgb, StandardFonts, type PDFPage } from 'pdf-lib';

/**
 * PDF operations built on pdf-lib. They run inside a Web Worker in the browser
 * (see src/workers/pdf.worker.ts) and directly in Node for unit tests.
 * Encrypted documents are rejected — we never bypass document protection.
 */
export type Progress = (p: number) => void;
const noop: Progress = () => {};

export class PdfError extends Error {
  constructor(
    message: string,
    public code: 'encrypted' | 'corrupt' | 'invalid' = 'invalid',
  ) {
    super(message);
    this.name = 'PdfError';
  }
}

export async function loadPdf(bytes: ArrayBuffer | Uint8Array, name = 'The file'): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/encrypt/i.test(msg) || (e instanceof Error && e.name === 'EncryptedPDFError')) {
      throw new PdfError(`${name} is password-protected (encrypted). It cannot be modified here, and we do not bypass document protection.`, 'encrypted');
    }
    throw new PdfError(`${name} could not be read. It may be corrupted or not a valid PDF. (${msg.slice(0, 120)})`, 'corrupt');
  }
}

const save = (doc: PDFDocument) => doc.save({ useObjectStreams: true });

export async function mergePdfs(files: { name: string; bytes: ArrayBuffer }[], progress: Progress = noop): Promise<Uint8Array> {
  if (files.length < 2) throw new PdfError('Select at least two PDF files to merge.');
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    const src = await loadPdf(files[i].bytes, `“${files[i].name}”`);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    progress((i + 1) / (files.length + 1));
  }
  const bytes = await save(out);
  progress(1);
  return bytes;
}

export async function pageCount(bytes: ArrayBuffer, name?: string): Promise<number> {
  return (await loadPdf(bytes, name)).getPageCount();
}

export async function copyPagesToNew(src: PDFDocument, indices: number[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return save(out);
}

export async function splitPdf(bytes: ArrayBuffer, groups: number[][], progress: Progress = noop): Promise<Uint8Array[]> {
  const src = await loadPdf(bytes);
  const out: Uint8Array[] = [];
  for (let i = 0; i < groups.length; i++) {
    out.push(await copyPagesToNew(src, groups[i]));
    progress((i + 1) / groups.length);
  }
  return out;
}

export async function extractPages(bytes: ArrayBuffer, indices: number[]): Promise<Uint8Array> {
  if (!indices.length) throw new PdfError('Select at least one page.');
  return copyPagesToNew(await loadPdf(bytes), indices);
}

/** New order of zero-based page indices; pages not listed are removed. */
export async function reorderPages(bytes: ArrayBuffer, order: number[]): Promise<Uint8Array> {
  if (!order.length) throw new PdfError('The document must keep at least one page.');
  return copyPagesToNew(await loadPdf(bytes), order);
}

export async function rotatePages(bytes: ArrayBuffer, angle: 90 | 180 | 270, indices: number[] | 'all'): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const pages = doc.getPages();
  const targets = indices === 'all' ? pages.map((_, i) => i) : indices;
  for (const i of targets) {
    const p = pages[i];
    if (!p) continue;
    p.setRotation(degrees((((p.getRotation().angle + angle) % 360) + 360) % 360));
  }
  return save(doc);
}

export const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
  a5: [419.53, 595.28],
} as const;

export interface ImagePage {
  bytes: Uint8Array;
  kind: 'jpeg' | 'png';
  /** Force the page to this size in points, image stretched to fill (used by "strong" compression). */
  page?: { width: number; height: number };
}

export async function imagesToPdf(
  images: ImagePage[],
  opts: { size: keyof typeof PAGE_SIZES | 'fit'; orientation: 'portrait' | 'landscape' | 'auto'; margin: number },
  progress: Progress = noop,
): Promise<Uint8Array> {
  if (!images.length) throw new PdfError('Add at least one image.');
  const doc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    const img = images[i].kind === 'jpeg' ? await doc.embedJpg(images[i].bytes) : await doc.embedPng(images[i].bytes);
    const { width: iw, height: ih } = img;
    const forced = images[i].page;
    if (forced) {
      const page = doc.addPage([forced.width, forced.height]);
      page.drawImage(img, { x: 0, y: 0, width: forced.width, height: forced.height });
      progress((i + 1) / images.length);
      continue;
    }
    let pw: number;
    let ph: number;
    if (opts.size === 'fit') {
      pw = iw + opts.margin * 2;
      ph = ih + opts.margin * 2;
    } else {
      [pw, ph] = PAGE_SIZES[opts.size];
      const landscape = opts.orientation === 'landscape' || (opts.orientation === 'auto' && iw > ih);
      if (landscape) [pw, ph] = [ph, pw];
    }
    const page = doc.addPage([pw, ph]);
    const maxW = pw - opts.margin * 2;
    const maxH = ph - opts.margin * 2;
    const s = Math.min(maxW / iw, maxH / ih, opts.size === 'fit' ? 1 : Infinity);
    const w = iw * s;
    const h = ih * s;
    page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    progress((i + 1) / images.length);
  }
  return save(doc);
}

export type NumberPosition = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';

export function pageNumberText(format: 'n' | 'page-n' | 'n-of-total' | 'page-n-of-total', n: number, total: number) {
  switch (format) {
    case 'n':
      return `${n}`;
    case 'page-n':
      return `Page ${n}`;
    case 'n-of-total':
      return `${n} / ${total}`;
    case 'page-n-of-total':
      return `Page ${n} of ${total}`;
  }
}

/** Visible page box (respects CropBox) and rotation-aware drawing helpers. */
function box(page: PDFPage) {
  const { x, y, width, height } = page.getCropBox();
  return { x, y, width, height };
}

export async function addPageNumbers(
  bytes: ArrayBuffer,
  opts: { position: NumberPosition; format: 'n' | 'page-n' | 'n-of-total' | 'page-n-of-total'; size: number; margin: number; start: number; skipFirst: number; color: [number, number, number] },
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const numbered = pages.length - opts.skipFirst;
  pages.forEach((page, i) => {
    if (i < opts.skipFirst) return;
    const n = opts.start + (i - opts.skipFirst);
    const text = pageNumberText(opts.format, n, opts.start + numbered - 1);
    const b = box(page);
    const tw = font.widthOfTextAtSize(text, opts.size);
    const [v, h] = opts.position.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right'];
    const x = h === 'left' ? b.x + opts.margin : h === 'right' ? b.x + b.width - opts.margin - tw : b.x + (b.width - tw) / 2;
    const y = v === 'top' ? b.y + b.height - opts.margin - opts.size : b.y + opts.margin;
    page.drawText(text, { x, y, size: opts.size, font, color: rgb(...opts.color) });
  });
  return save(doc);
}

export async function addWatermark(
  bytes: ArrayBuffer,
  opts: { text: string; size: number; opacity: number; angle: number; color: [number, number, number]; pages: number[] | 'all'; position: 'center' | 'tile' },
): Promise<Uint8Array> {
  const text = opts.text.trim();
  if (!text) throw new PdfError('Enter the watermark text.');
  // Standard fonts only support WinAnsi characters
  if (/[^ -~\u00A0-ÿ€]/.test(text)) throw new PdfError('The watermark text contains characters not supported by the standard PDF font (Latin characters only).');
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const targets = opts.pages === 'all' ? pages.map((_, i) => i) : opts.pages;
  const rad = (opts.angle * Math.PI) / 180;
  for (const i of targets) {
    const page = pages[i];
    if (!page) continue;
    const b = box(page);
    const tw = font.widthOfTextAtSize(text, opts.size);
    const draw = (cx: number, cy: number) => {
      // position so that the text's center is at (cx, cy) after rotation
      const x = cx - (Math.cos(rad) * tw) / 2 + (Math.sin(rad) * opts.size) / 2;
      const y = cy - (Math.sin(rad) * tw) / 2 - (Math.cos(rad) * opts.size) / 2;
      page.drawText(text, { x, y, size: opts.size, font, color: rgb(...opts.color), opacity: opts.opacity, rotate: degrees(opts.angle) });
    };
    if (opts.position === 'center') draw(b.x + b.width / 2, b.y + b.height / 2);
    else {
      const stepX = tw * 0.9 + 80;
      const stepY = opts.size * 5;
      for (let yy = b.y; yy < b.y + b.height + stepY; yy += stepY) for (let xx = b.x; xx < b.x + b.width + stepX; xx += stepX) draw(xx, yy);
    }
  }
  return save(doc);
}

export async function compressLossless(bytes: ArrayBuffer): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  // Re-saving with object streams compresses the cross-reference structure and drops unreferenced objects.
  return doc.save({ useObjectStreams: true, addDefaultPage: false });
}

export interface PdfInfo {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  version: string | null;
  pageSizes: { width: number; height: number; rotation: number }[];
}

export function pdfVersion(bytes: Uint8Array): string | null {
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
  return /%PDF-(\d\.\d)/.exec(head)?.[1] ?? null;
}

export async function getPdfInfo(bytes: ArrayBuffer): Promise<PdfInfo> {
  const doc = await loadPdf(bytes);
  const d = (x: Date | undefined) => (x ? x.toISOString() : undefined);
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle(),
    author: doc.getAuthor(),
    subject: doc.getSubject(),
    keywords: doc.getKeywords(),
    creator: doc.getCreator(),
    producer: doc.getProducer(),
    creationDate: d(doc.getCreationDate()),
    modificationDate: d(doc.getModificationDate()),
    version: pdfVersion(new Uint8Array(bytes)),
    pageSizes: doc.getPages().map((p) => ({ width: Math.round(p.getWidth() * 100) / 100, height: Math.round(p.getHeight() * 100) / 100, rotation: p.getRotation().angle })),
  };
}

/** Common paper name for a size in points (±2pt tolerance, either orientation). */
export function paperName(w: number, h: number): string | null {
  const names: Record<string, readonly [number, number]> = { A4: PAGE_SIZES.a4, Letter: PAGE_SIZES.letter, Legal: PAGE_SIZES.legal, A5: PAGE_SIZES.a5, A3: [841.89, 1190.55] };
  for (const [n, [pw, ph]] of Object.entries(names)) if ((Math.abs(w - pw) < 2 && Math.abs(h - ph) < 2) || (Math.abs(w - ph) < 2 && Math.abs(h - pw) < 2)) return n;
  return null;
}
