/// <reference lib="webworker" />
import { renderImage } from '../lib/file-processing/image-render';
import type { ImageOps } from '../lib/file-processing/image-geometry';

interface Req {
  id: number;
  blob: Blob;
  ops: ImageOps;
}

self.onmessage = async (e: MessageEvent<Req>) => {
  const { id, blob, ops } = e.data;
  let bmp: ImageBitmap | null = null;
  try {
    bmp = await createImageBitmap(blob);
    const out = await renderImage(bmp, ops, (w, h) => new OffscreenCanvas(w, h));
    if (out.type !== ops.mime) throw new Error(`Your browser cannot encode ${ops.mime}.`);
    (self as unknown as Worker).postMessage({ id, ok: true, blob: out, width: bmp.width, height: bmp.height });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  } finally {
    bmp?.close();
  }
};
