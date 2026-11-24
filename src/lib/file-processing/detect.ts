/**
 * File type detection from "magic numbers" (file signatures).
 * The browser-provided MIME type comes from the file extension and cannot be
 * trusted, so tools validate the actual bytes before processing.
 */
export type DetectedType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/bmp'
  | 'image/x-icon'
  | 'image/avif'
  | 'image/heic'
  | 'image/tiff'
  | 'image/svg+xml'
  | 'application/pdf'
  | 'application/zip'
  | 'text/plain'
  | 'unknown';

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);
const ascii = (b: Uint8Array, start: number, len: number) => String.fromCharCode(...b.subarray(start, start + len));

export function detectFromBytes(b: Uint8Array): DetectedType {
  if (b.length >= 3 && startsWith(b, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (b.length >= 8 && startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (b.length >= 6 && (ascii(b, 0, 6) === 'GIF87a' || ascii(b, 0, 6) === 'GIF89a')) return 'image/gif';
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'image/webp';
  if (b.length >= 2 && ascii(b, 0, 2) === 'BM') return 'image/bmp';
  if (b.length >= 4 && startsWith(b, [0x00, 0x00, 0x01, 0x00])) return 'image/x-icon';
  if (b.length >= 4 && (startsWith(b, [0x49, 0x49, 0x2a, 0x00]) || startsWith(b, [0x4d, 0x4d, 0x00, 0x2a]))) return 'image/tiff';
  if (b.length >= 12 && ascii(b, 4, 4) === 'ftyp') {
    const brand = ascii(b, 8, 4);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (['heic', 'heix', 'mif1', 'msf1', 'hevc'].includes(brand)) return 'image/heic';
  }
  // %PDF may be preceded by a little garbage; spec allows it within the first 1024 bytes
  const head = ascii(b, 0, Math.min(b.length, 1024));
  if (head.includes('%PDF-')) return 'application/pdf';
  if (b.length >= 4 && startsWith(b, [0x50, 0x4b, 0x03, 0x04])) return 'application/zip';
  const text = new TextDecoder('utf-8', { fatal: false }).decode(b.subarray(0, Math.min(b.length, 2048)));
  if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(text)) return 'image/svg+xml';
  // eslint-disable-next-line no-control-regex
  if (b.length && !/[\u0000-\u0008\u000e-\u001f]/.test(text)) return 'text/plain';
  return 'unknown';
}

export async function detectFileType(file: Blob): Promise<DetectedType> {
  const buf = new Uint8Array(await file.slice(0, 2048).arrayBuffer());
  return detectFromBytes(buf);
}

export const RASTER_IMAGE_TYPES: DetectedType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/x-icon',
  'image/avif',
];
