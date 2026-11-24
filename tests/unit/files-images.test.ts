import { describe, expect, it } from 'vitest';
import { detectFromBytes } from '../../src/lib/file-processing/detect';
import { validateFile } from '../../src/lib/file-processing/validate';
import { formatBytes, savedPercent } from '../../src/lib/file-processing/format';
import { checkCanvasSize, clampCrop, downscaleSteps, fitDimensions, normalizeRotation, rotatedSize } from '../../src/lib/file-processing/image-geometry';
import { basicSvgSanitize, buildIco, svgIntrinsicSize, withSvgSize } from '../../src/features/image-tools/logic';
import { safeFilename, withExtension, withSuffix } from '../../src/lib/security/url';

const bytes = (...n: number[]) => new Uint8Array(n);
const ascii = (s: string) => new TextEncoder().encode(s);

describe('file signature detection', () => {
  it('detects common formats from magic numbers', () => {
    expect(detectFromBytes(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(detectFromBytes(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png');
    expect(detectFromBytes(ascii('GIF89a....'))).toBe('image/gif');
    expect(detectFromBytes(ascii('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
    expect(detectFromBytes(ascii('%PDF-1.7\n'))).toBe('application/pdf');
    expect(detectFromBytes(ascii('<?xml version="1.0"?>\n<svg xmlns="x">'))).toBe('image/svg+xml');
    expect(detectFromBytes(bytes(0x50, 0x4b, 0x03, 0x04))).toBe('application/zip');
    expect(detectFromBytes(bytes(0x00, 0x01, 0x02, 0x03, 0x04))).toBe('unknown');
  });
});

describe('validateFile', () => {
  const opts = { maxBytes: 1000, accept: ['image/png' as const], acceptLabel: 'PNG' };
  it('rejects files whose content does not match the extension', async () => {
    const fake = new File([ascii('%PDF-1.4 not an image')], 'photo.png', { type: 'image/png' });
    await expect(validateFile(fake, opts)).rejects.toThrow(/not a supported file/);
  });
  it('rejects oversized and empty files', async () => {
    await expect(validateFile(new File([new Uint8Array(2000)], 'a.png'), opts)).rejects.toThrow(/exceeds/);
    await expect(validateFile(new File([], 'a.png'), opts)).rejects.toThrow(/empty/);
  });
  it('accepts a real PNG', async () => {
    const f = new File([bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)], 'x.png');
    expect((await validateFile(f, opts)).type).toBe('image/png');
  });
});

describe('formatting', () => {
  it('formats sizes and savings', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(savedPercent(1000, 250)).toBe(75);
    expect(savedPercent(100, 120)).toBe(-20);
  });
});

describe('image geometry', () => {
  it('fits dimensions with aspect ratio', () => {
    expect(fitDimensions(4000, 3000, { width: 800 })).toEqual({ width: 800, height: 600 });
    expect(fitDimensions(4000, 3000, { width: 1000, height: 1000, lock: true })).toEqual({ width: 1000, height: 750 });
  });
  it('rotates sizes and normalizes angles', () => {
    expect(rotatedSize(100, 50, 90)).toEqual({ width: 50, height: 100 });
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
  });
  it('clamps crops inside the image', () => {
    expect(clampCrop({ x: -10, y: 90, width: 500, height: 50 }, 100, 100)).toEqual({ x: 0, y: 90, width: 100, height: 10 });
  });
  it('plans stepwise downscaling', () => {
    expect(downscaleSteps(4000, 4000, 500, 500)).toEqual([{ width: 2000, height: 2000 }, { width: 1000, height: 1000 }, { width: 500, height: 500 }]);
  });
  it('guards canvas limits', () => {
    expect(checkCanvasSize(20000, 10)).toMatch(/too large/);
    expect(checkCanvasSize(1000, 1000)).toBeNull();
  });
});

describe('favicon ICO builder', () => {
  it('writes a valid ICONDIR header and entries', () => {
    const png = new Uint8Array([1, 2, 3, 4]);
    const ico = buildIco([{ size: 16, png }, { size: 256, png }]);
    const dv = new DataView(ico.buffer);
    expect(dv.getUint16(2, true)).toBe(1);
    expect(dv.getUint16(4, true)).toBe(2);
    expect(ico[6]).toBe(16);
    expect(ico[22]).toBe(0); // 256 is encoded as 0
    expect(dv.getUint32(6 + 12, true)).toBe(6 + 32);
    expect(ico.length).toBe(6 + 32 + 8);
  });
});

describe('SVG safety helpers', () => {
  it('removes scripts, handlers, foreignObject and external hrefs', () => {
    const dirty = `<svg onload="alert(1)"><script>alert(2)</script><foreignObject><div/></foreignObject><a href="javascript:alert(3)"><image href="https://evil.example/x.png"/></a><use href="#ok"/></svg>`;
    const clean = basicSvgSanitize(dirty);
    expect(clean).not.toMatch(/alert|script|foreignObject|evil|javascript/i);
    expect(clean).toContain('href="#ok"');
  });
  it('reads intrinsic size and sets explicit size', () => {
    expect(svgIntrinsicSize('<svg viewBox="0 0 200 100"></svg>')).toEqual({ width: 200, height: 100 });
    expect(withSvgSize('<svg width="10" viewBox="0 0 1 1">', 50, 60)).toBe('<svg viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg" width="50" height="60">');
  });
});

describe('safe filenames', () => {
  it('strips path separators and reserved characters', () => {
    expect(safeFilename('../../etc/passwd')).toBe('_.._etc_passwd');
    expect(safeFilename('a<b>:c?.png')).toBe('a_b_c_.png');
    expect(safeFilename('')).toBe('file');
    expect(withExtension('photo.final.JPG', 'webp')).toBe('photo.final.webp');
    expect(withSuffix('scan.pdf', 'compressed')).toBe('scan-compressed.pdf');
  });
});
