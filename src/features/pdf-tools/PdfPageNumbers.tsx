import { useState } from 'react';
import { Actions, NumberInput, ResetButton, Select } from '../../components/tools/kit';
import { hexToRgb01 } from './color';
import { runPdf } from './client';
import type { NumberPosition } from './logic';
import { baseName, PdfResult, SinglePdfInput, usePdf } from './shared';

type Fmt = 'n' | 'page-n' | 'n-of-total' | 'page-n-of-total';

export default function PdfPageNumbers() {
  const state = usePdf();
  const { pdf } = state;
  const [position, setPosition] = useState<NumberPosition>('bottom-center');
  const [format, setFormat] = useState<Fmt>('n');
  const [size, setSize] = useState<number | ''>(11);
  const [margin, setMargin] = useState<number | ''>(28);
  const [start, setStart] = useState<number | ''>(1);
  const [skip, setSkip] = useState<number | ''>(0);
  const [color, setColor] = useState('#1f2937');
  const [out, setOut] = useState<Uint8Array | null>(null);
  const apply = () =>
    state.run(async () =>
      setOut(
        await runPdf<Uint8Array>('numbers', [
          pdf!.bytes.slice(0),
          { position, format, size: Number(size) || 11, margin: Number(margin) || 0, start: Number(start) || 1, skipFirst: Math.min(Number(skip) || 0, pdf!.pages - 1), color: hexToRgb01(color) },
        ]),
      ),
    );
  return (
    <SinglePdfInput state={state}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select<NumberPosition>
          label="Position"
          value={position}
          onChange={setPosition}
          options={[
            { value: 'bottom-center', label: 'Bottom center' },
            { value: 'bottom-right', label: 'Bottom right' },
            { value: 'bottom-left', label: 'Bottom left' },
            { value: 'top-center', label: 'Top center' },
            { value: 'top-right', label: 'Top right' },
            { value: 'top-left', label: 'Top left' },
          ]}
        />
        <Select<Fmt>
          label="Format"
          value={format}
          onChange={setFormat}
          options={[
            { value: 'n', label: '1' },
            { value: 'page-n', label: 'Page 1' },
            { value: 'n-of-total', label: '1 / 12' },
            { value: 'page-n-of-total', label: 'Page 1 of 12' },
          ]}
        />
        <NumberInput label="Font size" value={size} onChange={setSize} min={6} max={48} step={1} suffix="pt" />
        <NumberInput label="Margin" value={margin} onChange={setMargin} min={0} max={200} step={1} suffix="pt" />
        <NumberInput label="Start at number" value={start} onChange={setStart} min={0} step={1} />
        <NumberInput label="Skip first N pages" value={skip} onChange={setSkip} min={0} max={pdf ? pdf.pages - 1 : undefined} step={1} />
        <div>
          <label className="label" htmlFor="pn-color">
            Color
          </label>
          <input id="pn-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20 rounded border" />
        </div>
      </div>
      <Actions>
        <button type="button" className="btn-primary" onClick={apply} disabled={state.busy}>
          Add page numbers
        </button>
        <ResetButton onClick={() => (state.setPdf(null), setOut(null))} />
      </Actions>
      {out && pdf && <PdfResult bytes={out} name={`${baseName(pdf.file.name)}-numbered.pdf`} />}
    </SinglePdfInput>
  );
}
