import { useState } from 'react';
import { Actions, ErrorBox, ResetButton, Segmented } from '../../components/tools/kit';
import { runPdf } from './client';
import { flattenRanges, parsePageRanges } from './ranges';
import { baseName, PdfResult, SinglePdfInput, usePdf } from './shared';

export default function PdfRotate() {
  const state = usePdf();
  const { pdf } = state;
  const [angle, setAngle] = useState<'90' | '180' | '270'>('90');
  const [scope, setScope] = useState<'all' | 'some'>('all');
  const [sel, setSel] = useState('');
  const [out, setOut] = useState<Uint8Array | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const rotate = () => {
    if (!pdf) return;
    let pages: number[] | 'all' = 'all';
    if (scope === 'some') {
      try {
        pages = flattenRanges(parsePageRanges(sel, pdf.pages));
      } catch (e) {
        return setErr(e instanceof Error ? e.message : String(e));
      }
    }
    setErr(null);
    state.run(async () => setOut(await runPdf<Uint8Array>('rotate', [pdf.bytes.slice(0), Number(angle), pages])));
  };
  return (
    <SinglePdfInput state={state}>
      <div className="flex flex-wrap gap-4">
        <Segmented label="Angle" value={angle} onChange={(a) => (setAngle(a), setOut(null))} options={[{ value: '90', label: '90° ↻' }, { value: '180', label: '180°' }, { value: '270', label: '90° ↺' }]} />
        <Segmented label="Pages" value={scope} onChange={(s) => (setScope(s), setOut(null))} options={[{ value: 'all', label: 'All pages' }, { value: 'some', label: 'Selected pages' }]} />
      </div>
      {scope === 'some' && (
        <div>
          <label className="label" htmlFor="rot-sel">
            Pages to rotate
          </label>
          <input id="rot-sel" className="input font-mono" value={sel} onChange={(e) => setSel(e.target.value)} placeholder="1, 3-5" />
        </div>
      )}
      <ErrorBox error={err} />
      <Actions>
        <button type="button" className="btn-primary" onClick={rotate} disabled={state.busy}>
          Rotate PDF
        </button>
        <ResetButton onClick={() => (state.setPdf(null), setOut(null))} />
      </Actions>
      {out && pdf && <PdfResult bytes={out} name={`${baseName(pdf.file.name)}-rotated.pdf`} />}
    </SinglePdfInput>
  );
}
