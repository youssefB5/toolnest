/// <reference lib="webworker" />
/** Runs pdf-lib operations off the main thread so large documents don't freeze the page. */
import * as ops from '../features/pdf-tools/logic';

type Op = 'merge' | 'split' | 'extract' | 'reorder' | 'rotate' | 'images' | 'numbers' | 'watermark' | 'compress' | 'info' | 'count';

interface Req {
  id: number;
  op: Op;
  args: unknown[];
}

const post = (msg: unknown, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(msg, transfer);

self.onmessage = async (e: MessageEvent<Req>) => {
  const { id, op, args } = e.data;
  const progress = (p: number) => post({ id, progress: p });
  try {
    let result: unknown;
    switch (op) {
      case 'merge':
        result = await ops.mergePdfs(args[0] as { name: string; bytes: ArrayBuffer }[], progress);
        break;
      case 'split':
        result = await ops.splitPdf(args[0] as ArrayBuffer, args[1] as number[][], progress);
        break;
      case 'extract':
        result = await ops.extractPages(args[0] as ArrayBuffer, args[1] as number[]);
        break;
      case 'reorder':
        result = await ops.reorderPages(args[0] as ArrayBuffer, args[1] as number[]);
        break;
      case 'rotate':
        result = await ops.rotatePages(args[0] as ArrayBuffer, args[1] as 90 | 180 | 270, args[2] as number[] | 'all');
        break;
      case 'images':
        result = await ops.imagesToPdf(args[0] as ops.ImagePage[], args[1] as Parameters<typeof ops.imagesToPdf>[1], progress);
        break;
      case 'numbers':
        result = await ops.addPageNumbers(args[0] as ArrayBuffer, args[1] as Parameters<typeof ops.addPageNumbers>[1]);
        break;
      case 'watermark':
        result = await ops.addWatermark(args[0] as ArrayBuffer, args[1] as Parameters<typeof ops.addWatermark>[1]);
        break;
      case 'compress':
        result = await ops.compressLossless(args[0] as ArrayBuffer);
        break;
      case 'info':
        result = await ops.getPdfInfo(args[0] as ArrayBuffer);
        break;
      case 'count':
        result = await ops.pageCount(args[0] as ArrayBuffer, args[1] as string | undefined);
        break;
      default:
        throw new Error(`Unknown operation ${op}`);
    }
    const transfer: Transferable[] = [];
    if (result instanceof Uint8Array) transfer.push(result.buffer);
    else if (Array.isArray(result)) for (const r of result) if (r instanceof Uint8Array) transfer.push(r.buffer);
    post({ id, ok: true, result }, transfer);
  } catch (err) {
    post({ id, ok: false, error: err instanceof Error ? err.message : String(err), code: (err as { code?: string })?.code });
  }
};
