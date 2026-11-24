import { useState } from 'react';
import { Actions, ErrorBox, NumberInput, Progress, ResetButton, Segmented, ZipButton } from '../../components/tools/kit';
import { downloadBlob } from '../../lib/file-processing/download';
import { formatBytes } from '../../lib/file-processing/format';
import { pdfBlob, runPdf } from './client';
import { chunkPages, describeGroup, parsePageRanges } from './ranges';
import { baseName, SinglePdfInput, usePdf } from './shared';

export default function PdfSplit() {
  const state = usePdf();
  const { pdf } = state;
  const [mode, setMode] = useState<'each' | 'every' | 'ranges'>('each');
  const [every, setEvery] = useState<number | ''>(2);
  const [ranges, setRanges] = useState('');
  const [parts, setParts] = useState<{ name: string; blob: Blob }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const split = () => {
    if (!pdf) return;
    let groups: number[][];
    try {
      groups =
        mode === 'each' ? chunkPages(pdf.pages, 1) : mode === 'every' ? chunkPages(pdf.pages, Number(every) || 1) : parsePageRanges(ranges, pdf.pages);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      return;
    }
    state.run(async (report) => {
      const out = await runPdf<Uint8Array[]>('split', [pdf.bytes.slice(0), groups], report);
      const base = baseName(pdf.file.name);
      setParts(out.map((b, i) => ({ name: `${base}-pages-${describeGroup(groups[i])}.pdf`, blob: pdfBlob(b) })));
    });
  };
  return (
    <SinglePdfInput state={state}>
      <Segmented label="Split mode" value={mode} onChange={(m) => (setMode(m), setParts([]))} options={[{ value: 'each', label: 'Every page' }, { value: 'every', label: 'Every N pages' }, { value: 'ranges', label: 'Custom ranges' }]} />
      {mode === 'every' && <NumberInput label="Pages per file" value={every} onChange={setEvery} min={1} max={pdf?.pages} step={1} />}
      {mode === 'ranges' && (
        <div>
          <label className="label" htmlFor="split-ranges">
            Ranges (one file per comma-separated part)
          </label>
          <input id="split-ranges" className="input font-mono" value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 4-10, 11-" />
        </div>
      )}
      <ErrorBox error={err} />
      <Actions>
        <button type="button" className="btn-primary" onClick={split} disabled={state.busy}>
          Split PDF
        </button>
        <ResetButton onClick={() => (state.setPdf(null), setParts([]))} />
      </Actions>
      {state.busy && <Progress value={state.progress} />}
      {parts.length > 0 && (
        <section className="space-y-2" aria-label="Results">
          <p className="text-sm font-medium">{parts.length} files created</p>
          <ul className="max-h-72 space-y-1 overflow-auto">
            {parts.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-2 rounded border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-800">
                <span className="truncate">{p.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{formatBytes(p.blob.size)}</span>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => downloadBlob(p.blob, p.name)}>
                    Download
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <ZipButton files={parts} zipName={`${baseName(pdf!.file.name)}-split.zip`} />
        </section>
      )}
    </SinglePdfInput>
  );
}
