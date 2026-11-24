import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  addPageNumbers,
  addWatermark,
  compressLossless,
  extractPages,
  getPdfInfo,
  imagesToPdf,
  loadPdf,
  mergePdfs,
  pageNumberText,
  paperName,
  reorderPages,
  rotatePages,
  splitPdf,
} from '../../src/features/pdf-tools/logic';
import { chunkPages, flattenRanges, parsePageRanges } from '../../src/features/pdf-tools/ranges';

async function makePdf(pages: number, title = 'Test'): Promise<ArrayBuffer> {
  const d = await PDFDocument.create();
  d.setTitle(title);
  for (let i = 0; i < pages; i++) d.addPage([595.28, 841.89]);
  const bytes = await d.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
const count = async (u: Uint8Array) => (await PDFDocument.load(u)).getPageCount();

// 1x1 transparent PNG
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));

describe('page ranges', () => {
  it('parses ranges and open ranges', () => {
    expect(parsePageRanges('1-2, 5, 8-', 10)).toEqual([[0, 1], [4], [7, 8, 9]]);
    expect(flattenRanges(parsePageRanges('3,1-3', 5))).toEqual([2, 0, 1]);
  });
  it('rejects out-of-range and invalid parts', () => {
    expect(() => parsePageRanges('12', 10)).toThrow(/outside/);
    expect(() => parsePageRanges('a-b', 10)).toThrow(/not a valid/);
    expect(() => parsePageRanges('', 10)).toThrow();
  });
  it('chunks pages', () => {
    expect(chunkPages(5, 2)).toEqual([[0, 1], [2, 3], [4]]);
  });
});

describe('pdf-lib operations', () => {
  it('merges documents', async () => {
    const out = await mergePdfs([
      { name: 'a', bytes: await makePdf(2) },
      { name: 'b', bytes: await makePdf(3) },
    ]);
    expect(await count(out)).toBe(5);
  });
  it('requires two files to merge', async () => {
    await expect(mergePdfs([{ name: 'a', bytes: await makePdf(1) }])).rejects.toThrow(/two/);
  });
  it('splits, extracts and reorders', async () => {
    const src = await makePdf(6);
    const parts = await splitPdf(src, [[0, 1], [2], [3, 4, 5]]);
    expect(await Promise.all(parts.map(count))).toEqual([2, 1, 3]);
    expect(await count(await extractPages(src, [1, 3]))).toBe(2);
    expect(await count(await reorderPages(src, [5, 4]))).toBe(2);
  });
  it('rotates selected pages cumulatively', async () => {
    const out = await rotatePages(await makePdf(2), 90, [1]);
    const again = await rotatePages(ab(out), 270, 'all');
    const d = await PDFDocument.load(again);
    expect(d.getPages().map((p) => p.getRotation().angle)).toEqual([270, 0]);
  });
  it('adds page numbers and watermark', async () => {
    const n = await addPageNumbers(await makePdf(3), { position: 'bottom-center', format: 'page-n-of-total', size: 10, margin: 20, start: 1, skipFirst: 1, color: [0, 0, 0] });
    expect(await count(n)).toBe(3);
    const w = await addWatermark(await makePdf(2), { text: 'DRAFT', size: 40, opacity: 0.2, angle: 45, color: [1, 0, 0], pages: 'all', position: 'tile' });
    expect(w.length).toBeGreaterThan(500);
    await expect(addWatermark(await makePdf(1), { text: 'سري', size: 40, opacity: 0.2, angle: 45, color: [1, 0, 0], pages: 'all', position: 'center' })).rejects.toThrow(/Latin/);
  });
  it('builds a PDF from images, including forced page sizes', async () => {
    const out = await imagesToPdf([{ bytes: PNG, kind: 'png' }, { bytes: PNG, kind: 'png', page: { width: 300, height: 400 } }], { size: 'a4', orientation: 'auto', margin: 20 });
    const d = await PDFDocument.load(out);
    expect(d.getPageCount()).toBe(2);
    expect(Math.round(d.getPage(1).getWidth())).toBe(300);
  });
  it('reads document info', async () => {
    const info = await getPdfInfo(await makePdf(2, 'Hello'));
    expect(info.pageCount).toBe(2);
    expect(info.title).toBe('Hello');
    expect(info.version).toMatch(/^\d\.\d$/);
    expect(paperName(info.pageSizes[0].width, info.pageSizes[0].height)).toBe('A4');
  });
  it('lossless compression returns a valid PDF', async () => {
    expect(await count(await compressLossless(await makePdf(4)))).toBe(4);
  });
  it('rejects corrupt input with a clear message', async () => {
    await expect(loadPdf(new TextEncoder().encode('not a pdf'))).rejects.toThrow(/could not be read/);
  });
  it('formats page number text', () => {
    expect(pageNumberText('n-of-total', 2, 9)).toBe('2 / 9');
  });
});
