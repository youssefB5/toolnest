/** Pure geometry helpers shared by the image worker and the main thread (unit-tested). */

export type Rotation = 0 | 90 | 180 | 270;

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageOps {
  /** Output size before rotation (after crop). Omit to keep size. */
  width?: number;
  height?: number;
  rotate?: Rotation;
  flipH?: boolean;
  flipV?: boolean;
  crop?: CropRect;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number; // 0..1
  /** Fill color for transparent pixels (required for JPEG). */
  background?: string | null;
}

export const MAX_CANVAS_SIDE = 16384;
export const MAX_CANVAS_AREA = 268_435_456; // 16384²; browsers may be lower (iOS ≈ 16.7 MP)

export function normalizeRotation(deg: number): Rotation {
  const r = (((Math.round(deg / 90) * 90) % 360) + 360) % 360;
  return r as Rotation;
}

export function rotatedSize(w: number, h: number, rotate: Rotation) {
  return rotate === 90 || rotate === 270 ? { width: h, height: w } : { width: w, height: h };
}

export function clampCrop(c: CropRect, w: number, h: number): CropRect {
  const x = Math.max(0, Math.min(Math.round(c.x), w - 1));
  const y = Math.max(0, Math.min(Math.round(c.y), h - 1));
  const width = Math.max(1, Math.min(Math.round(c.width), w - x));
  const height = Math.max(1, Math.min(Math.round(c.height), h - y));
  return { x, y, width, height };
}

/** Compute target dimensions, keeping aspect ratio when one side is missing or lock is on. */
export function fitDimensions(
  srcW: number,
  srcH: number,
  opts: { width?: number | null; height?: number | null; lock?: boolean },
): { width: number; height: number } {
  const ratio = srcW / srcH;
  let w = opts.width && opts.width > 0 ? opts.width : null;
  let h = opts.height && opts.height > 0 ? opts.height : null;
  if (w && h && opts.lock) {
    // fit inside the box
    if (w / h > ratio) w = h * ratio;
    else h = w / ratio;
  } else if (w && !h) h = w / ratio;
  else if (h && !w) w = h * ratio;
  else if (!w && !h) {
    w = srcW;
    h = srcH;
  }
  return { width: Math.max(1, Math.round(w!)), height: Math.max(1, Math.round(h!)) };
}

export function checkCanvasSize(w: number, h: number): string | null {
  if (w > MAX_CANVAS_SIDE || h > MAX_CANVAS_SIDE) return `Output too large (${w}×${h}). The maximum is ${MAX_CANVAS_SIDE}px per side.`;
  if (w * h > MAX_CANVAS_AREA) return `Output too large (${w}×${h}).`;
  return null;
}

/**
 * Successive halving sizes for high-quality downscaling (avoids aliasing when
 * reducing by more than 2x in one step).
 */
export function downscaleSteps(srcW: number, srcH: number, dstW: number, dstH: number) {
  const steps: { width: number; height: number }[] = [];
  let w = srcW;
  let h = srcH;
  while (w / 2 > dstW && h / 2 > dstH) {
    w = Math.round(w / 2);
    h = Math.round(h / 2);
    steps.push({ width: w, height: h });
  }
  steps.push({ width: dstW, height: dstH });
  return steps;
}

export function extForMime(mime: string): string {
  return mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : 'img';
}
