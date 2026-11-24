import { useState } from 'react';
import { Actions, Notice, Progress, Range, ResetButton, Segmented } from '../../components/tools/kit';
import { runPdf } from './client';
import { canvasToBlob, openPdf, renderPage } from './pdfjs';
import { baseName, PdfResult, SinglePdfInput, usePdf } from './shared';

export default function PdfCompress() {
  const state = usePdf();
  const { pdf } = state;
  const [mode, setMode] = useState<'lossless' | 'strong'>('lossless');
  const [quality, setQuality] = useState(60);
  const [dpi, setDpi] = useState(110);
  const [out, setOut] = useState<Uint8Array | null>(null);
  const [kept, setKept] = useState(false);

  const compress = () =>
    state.run(async (report) => {
      if (!pdf) return;
      setKept(false);
      let result: Uint8Array;
      if (mode === 'lossless') {
        result = await runPdf<Uint8Array>('compress', [pdf.bytes.slice(0)]);
      } else {
        const doc = await openPdf(pdf.bytes);
        const images: { bytes: Uint8Array; kind: 'jpeg'; page: { width: number; height: number } }[] = [];
        try {
          for (let i = 1; i <= doc.numPages; i++) {
            const vp = (await doc.getPage(i)).getViewport({ scale: 1 }); // visible size in points (rotation applied)
            const canvas = await renderPage(doc, i, { scale: dpi / 72, maxSide: 5000 });
            const blob = await canvasToBlob(canvas, 'image/jpeg', quality / 100);
            canvas.width = canvas.height = 0; // release memory
            images.push({ bytes: new Uint8Array(await blob.arrayBuffer()), kind: 'jpeg', page: { width: vp.width, height: vp.height } });
            report((i / doc.numPages) * 0.9);
          }
        } finally {
          doc.loadingTask.destroy();
        }
        // pages keep their original dimensions; only the content becomes a compressed image
        result = await runPdf<Uint8Array>('images', [images, { size: 'fit', orientation: 'auto', margin: 0 }]);
      }
      if (result.length >= pdf.file.size) {
        setKept(true);
        result = new Uint8Array(pdf.bytes.slice(0));
      }
      report(1);
      setOut(result);
    });

  return (
    <SinglePdfInput state={state}>
      <Segmented label="Compression mode" value={mode} onChange={(m) => (setMode(m), setOut(null))} options={[{ value: 'lossless', label: 'Lossless (keeps text)' }, { value: 'strong', label: 'Strong (pages become images)' }]} />
      {mode === 'strong' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Range label="Image quality" value={quality} onChange={setQuality} min={20} max={95} format={(v) => `${v}%`} />
            <Range label="Resolution" value={dpi} onChange={setDpi} min={72} max={200} step={2} format={(v) => `${v} DPI`} />
          </div>
          <Notice tone="warn">Strong mode rasterizes every page: text will no longer be selectable or searchable, and links and form fields are removed.</Notice>
        </>
      )}
      <Actions>
        <button type="button" className="btn-primary" onClick={compress} disabled={state.busy}>
          Compress PDF
        </button>
        <ResetButton onClick={() => (state.setPdf(null), setOut(null))} />
      </Actions>
      {state.busy && <Progress value={state.progress} />}
      {kept && (
        <Notice tone="warn">
          This PDF could not be made smaller with the selected settings — it is probably already optimized. The original file is returned unchanged.
          {mode === 'lossless' ? ' Try Strong mode for scanned documents.' : ' Try a lower quality or resolution.'}
        </Notice>
      )}
      {out && pdf && <PdfResult bytes={out} name={`${baseName(pdf.file.name)}-compressed.pdf`} originalSize={pdf.file.size} />}
    </SinglePdfInput>
  );
}
