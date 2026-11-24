import { checkCanvasSize, clampCrop, downscaleSteps, rotatedSize, type ImageOps } from './image-geometry';

/**
 * Canvas pipeline used both inside the Web Worker (OffscreenCanvas) and on the
 * main thread (HTMLCanvasElement) when OffscreenCanvas is unavailable (older Safari).
 */
type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type Ctx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
type Source = ImageBitmap | HTMLImageElement | AnyCanvas;

export type CanvasFactory = (w: number, h: number) => AnyCanvas;

function ctx2d(c: AnyCanvas): Ctx {
  const ctx = c.getContext('2d') as Ctx | null;
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

function srcSize(s: Source) {
  if ('naturalWidth' in s) return { width: s.naturalWidth, height: s.naturalHeight };
  return { width: s.width, height: s.height };
}

export async function renderImage(source: Source, ops: ImageOps, make: CanvasFactory): Promise<Blob> {
  const { width: sw, height: sh } = srcSize(source);
  const crop = ops.crop ? clampCrop(ops.crop, sw, sh) : { x: 0, y: 0, width: sw, height: sh };
  const outW = Math.max(1, Math.round(ops.width ?? crop.width));
  const outH = Math.max(1, Math.round(ops.height ?? crop.height));
  const rotate = ops.rotate ?? 0;
  const final = rotatedSize(outW, outH, rotate);
  const err = checkCanvasSize(final.width, final.height);
  if (err) throw new Error(err);

  // 1) crop + (stepwise) resize
  let current: Source = source;
  let cx = crop.x;
  let cy = crop.y;
  let cw = crop.width;
  let ch = crop.height;
  for (const step of downscaleSteps(cw, ch, outW, outH)) {
    const c = make(step.width, step.height);
    ctx2d(c).drawImage(current as CanvasImageSource, cx, cy, cw, ch, 0, 0, step.width, step.height);
    current = c;
    cx = 0;
    cy = 0;
    cw = step.width;
    ch = step.height;
  }

  // 2) rotate / flip / background
  const out = make(final.width, final.height);
  const g = ctx2d(out);
  const bg = ops.background ?? (ops.mime === 'image/jpeg' ? '#ffffff' : null);
  if (bg) {
    g.fillStyle = bg;
    g.fillRect(0, 0, final.width, final.height);
  }
  g.translate(final.width / 2, final.height / 2);
  if (rotate) g.rotate((rotate * Math.PI) / 180);
  g.scale(ops.flipH ? -1 : 1, ops.flipV ? -1 : 1);
  g.drawImage(current as CanvasImageSource, -outW / 2, -outH / 2, outW, outH);

  const quality = ops.mime === 'image/png' ? undefined : Math.min(1, Math.max(0.05, ops.quality ?? 0.92));
  if ('convertToBlob' in out) return out.convertToBlob({ type: ops.mime, quality });
  return new Promise<Blob>((resolve, reject) =>
    (out as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed.'))), ops.mime, quality),
  );
}
