import { useState } from 'react';
import { Actions, ErrorBox, Progress, Range, ResetButton, Segmented, ZipButton } from '../../components/tools/kit';
import { downloadBlob } from '../../lib/file-processing/download';
import { formatBytes } from '../../lib/file-processing/format';
import { flattenRanges, parsePageRanges } from './ranges';
import { canvasToBlob, openPdf, renderPage } from './pdfjs';
import { baseName, SinglePdfInput, usePdf } from './shared';

export default function PdfToImages() {
  const state = usePdf();
  const { pdf } = state;
  const [fmt, setFmt] = useState<'png' | 'jpeg'>('png');
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(85);
  const [scope, setScope] = useState<'all' | 'some'>('all');
  const [sel, setSel] = useState('');
  const [images, setImages] = useState<{ name: string; blob: Blob }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const convert = () => {
    if (!pdf) return;
    let pages: number[];
    try {
      pages = scope === 'all' ? Array.from({ length: pdf.pages }, (_, i) => i) : flattenRanges(parsePageRanges(sel, pdf.pages));
      setErr(null);
    } catch (e) {
      return setErr(e instanceof Error ? e.message : String(e));
    }
    state.run(async (report) => {
      const doc = await openPdf(pdf.bytes);
      const out: { name: string; blob: Blob }[] = [];
      try {
        for (let k = 0; k < pages.length; k++) {
          const canvas = await renderPage(doc, pages[k] + 1, { scale: dpi / 72, maxSide: 10000 });
          const blob = await canvasToBlob(canvas, fmt === 'png' ? 'image/png' : 'image/jpeg', fmt === 'jpeg' ? quality / 100 : undefined);
          canvas.width = canvas.height = 0;
          out.push({ name: `${baseName(pdf.file.name)}-page-${String(pages[k] + 1).padStart(String(pdf.pages).length, '0')}.${fmt === 'png' ? 'png' : 'jpg'}`, blob });
          report((k + 1) / pages.length);
        }
      } finally {
        doc.loadingTask.destroy();
      }
      setImages(out);
    });
  };
  return (
    <SinglePdfInput state={state}>
      <div className="flex flex-wrap gap-4">
        <Segmented label="Format" value={fmt} onChange={setFmt} options={[{ value: 'png', label: 'PNG' }, { value: 'jpeg', label: 'JPG' }]} />
        <Segmented label="Pages" value={scope} onChange={setScope} options={[{ value: 'all', label: 'All pages' }, { value: 'some', label: 'Selected pages' }]} />
      </div>
      {scope === 'some' && <input className="input font-mono" aria-label="Pages to convert" value={sel} onChange={(e) => setSel(e.target.value)} placeholder="1-3, 7" />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Range label="Resolution" value={dpi} onChange={setDpi} min={72} max={300} step={6} format={(v) => `${v} DPI`} />
        {fmt === 'jpeg' && <Range label="JPEG quality" value={quality} onChange={setQuality} min={30} max={100} format={(v) => `${v}%`} />}
      </div>
      <ErrorBox error={err} />
      <Actions>
        <button type="button" className="btn-primary" onClick={convert} disabled={state.busy}>
          Convert to images
        </button>
        <ResetButton onClick={() => (state.setPdf(null), setImages([]))} />
      </Actions>
      {state.busy && <Progress value={state.progress} />}
      {images.length > 0 && (
        <section className="space-y-2" aria-label="Results">
          <ul className="grid max-h-96 gap-1 overflow-auto">
            {images.map((im) => (
              <li key={im.name} className="flex items-center justify-between gap-2 rounded border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-800">
                <span className="truncate">{im.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{formatBytes(im.blob.size)}</span>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => downloadBlob(im.blob, im.name)}>
                    Download
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <ZipButton files={images} zipName={`${baseName(pdf!.file.name)}-images.zip`} />
        </section>
      )}
    </SinglePdfInput>
  );
}
