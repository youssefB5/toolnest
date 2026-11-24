import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { Actions, ErrorBox, ResetButton } from '../../components/tools/kit';
import { runPdf } from './client';
import { baseName, PdfResult, SinglePdfInput, Thumb, usePdf, usePdfJsDoc } from './shared';

export default function PdfReorder() {
  const state = usePdf();
  const { pdf } = state;
  const { doc, error: viewErr } = usePdfJsDoc(pdf?.bytes ?? null);
  const [order, setOrder] = useState<number[]>([]);
  const [out, setOut] = useState<Uint8Array | null>(null);
  useEffect(() => setOrder(pdf ? Array.from({ length: pdf.pages }, (_, i) => i) : []), [pdf]);
  const move = (pos: number, d: -1 | 1) => {
    setOrder((o) => {
      const n = [...o];
      [n[pos], n[pos + d]] = [n[pos + d], n[pos]];
      return n;
    });
    setOut(null);
  };
  return (
    <SinglePdfInput state={state}>
      <ErrorBox error={viewErr} />
      <Actions>
        <button type="button" className="btn-secondary btn-sm" onClick={() => (setOrder((o) => [...o].reverse()), setOut(null))}>
          Reverse order
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => (setOrder(Array.from({ length: pdf?.pages ?? 0 }, (_, i) => i)), setOut(null))}>
          Restore original
        </button>
        <span className="text-sm text-slate-500">{order.length} pages</span>
      </Actions>
      {doc && (
        <ol className="grid max-h-[36rem] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6" aria-label="Page order">
          {order.map((p, pos) => (
            <li key={p}>
              <Thumb doc={doc} page={p + 1} label={`${pos + 1}. (page ${p + 1})`}>
                <div className="mt-1 flex justify-center gap-0.5">
                  <button type="button" className="btn-ghost btn-sm px-2" disabled={pos === 0} onClick={() => move(pos, -1)} aria-label={`Move page ${p + 1} earlier`}>
                    <ArrowLeft className="flip-rtl size-4" aria-hidden="true" />
                  </button>
                  <button type="button" className="btn-ghost btn-sm px-2 text-red-600" disabled={order.length <= 1} onClick={() => (setOrder((o) => o.filter((_, i) => i !== pos)), setOut(null))} aria-label={`Remove page ${p + 1}`}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                  <button type="button" className="btn-ghost btn-sm px-2" disabled={pos === order.length - 1} onClick={() => move(pos, 1)} aria-label={`Move page ${p + 1} later`}>
                    <ArrowRight className="flip-rtl size-4" aria-hidden="true" />
                  </button>
                </div>
              </Thumb>
            </li>
          ))}
        </ol>
      )}
      <Actions>
        <button type="button" className="btn-primary" disabled={state.busy || !order.length} onClick={() => state.run(async () => setOut(await runPdf<Uint8Array>('reorder', [pdf!.bytes.slice(0), order])))}>
          Save new order
        </button>
        <ResetButton onClick={() => (state.setPdf(null), setOut(null))} />
      </Actions>
      {out && pdf && <PdfResult bytes={out} name={`${baseName(pdf.file.name)}-reordered.pdf`} />}
    </SinglePdfInput>
  );
}
