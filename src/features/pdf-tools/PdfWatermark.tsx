import { useState } from 'react';
import { Actions, ErrorBox, NumberInput, Range, ResetButton, Segmented } from '../../components/tools/kit';
import { hexToRgb01 } from './color';
import { runPdf } from './client';
import { flattenRanges, parsePageRanges } from './ranges';
import { baseName, PdfResult, SinglePdfInput, usePdf } from './shared';

export default function PdfWatermark() {
  const state = usePdf();
  const { pdf } = state;
  const [text, setText] = useState('CONFIDENTIAL');
  const [size, setSize] = useState<number | ''>(56);
  const [opacity, setOpacity] = useState(20);
  const [angle, setAngle] = useState(45);
  const [color, setColor] = useState('#dc2626');
  const [position, setPosition] = useState<'center' | 'tile'>('center');
  const [scope, setScope] = useState<'all' | 'some'>('all');
  const [sel, setSel] = useState('');
  const [out, setOut] = useState<Uint8Array | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
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
    state.run(async () =>
      setOut(await runPdf<Uint8Array>('watermark', [pdf.bytes.slice(0), { text, size: Number(size) || 48, opacity: opacity / 100, angle, color: hexToRgb01(color), pages, position }])),
    );
  };
  return (
    <SinglePdfInput state={state}>
      <div>
        <label className="label" htmlFor="wm-text">
          Watermark text
        </label>
        <input id="wm-text" className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={80} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberInput label="Font size" value={size} onChange={setSize} min={8} max={200} step={1} suffix="pt" />
        <div>
          <label className="label" htmlFor="wm-color">
            Color
          </label>
          <input id="wm-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20 rounded border" />
        </div>
        <Range label="Opacity" value={opacity} onChange={setOpacity} min={5} max={100} format={(v) => `${v}%`} />
        <Range label="Angle" value={angle} onChange={setAngle} min={-90} max={90} format={(v) => `${v}°`} />
      </div>
      <div className="flex flex-wrap gap-4">
        <Segmented label="Layout" value={position} onChange={setPosition} options={[{ value: 'center', label: 'Centered' }, { value: 'tile', label: 'Tiled' }]} />
        <Segmented label="Pages" value={scope} onChange={setScope} options={[{ value: 'all', label: 'All pages' }, { value: 'some', label: 'Selected pages' }]} />
      </div>
      {scope === 'some' && <input className="input font-mono" aria-label="Pages to watermark" value={sel} onChange={(e) => setSel(e.target.value)} placeholder="1-3, 7" />}
      <ErrorBox error={err} />
      <Actions>
        <button type="button" className="btn-primary" onClick={apply} disabled={state.busy || !text.trim()}>
          Add watermark
        </button>
        <ResetButton onClick={() => (state.setPdf(null), setOut(null))} />
      </Actions>
      {out && pdf && <PdfResult bytes={out} name={`${baseName(pdf.file.name)}-watermarked.pdf`} />}
    </SinglePdfInput>
  );
}
