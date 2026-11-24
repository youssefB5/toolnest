import { useState } from 'react';
import { Actions, Checkbox, CopyButton, ErrorBox, FileRow, Progress, ResetButton, TextArea, useObjectUrl } from '../../components/tools/kit';
import { RASTER_IMAGE_TYPES } from '../../lib/file-processing/detect';
import { downloadBlob } from '../../lib/file-processing/download';
import { loadHtmlImage } from '../../lib/file-processing/image';
import { buildIco, faviconHtml, webManifest } from './logic';
import { SingleImagePicker, useSingleImage } from './shared';

const PNG_SIZES: [string, number][] = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['favicon-48x48.png', 48],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
];

async function renderSquare(img: HTMLImageElement, size: number, bg: string | null): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  if (bg) {
    g.fillStyle = bg;
    g.fillRect(0, 0, size, size);
  }
  const w = img.naturalWidth || 512;
  const h = img.naturalHeight || 512;
  const s = Math.min(size / w, size / h);
  g.drawImage(img, (size - w * s) / 2, (size - h * s) / 2, w * s, h * s);
  return new Promise((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error('PNG encoding failed'))), 'image/png'));
}

export default function FaviconGenerator() {
  const { file, setFile, busy, error, setError, run } = useSingleImage();
  const [useBg, setUseBg] = useState(false);
  const [bg, setBg] = useState('#ffffff');
  const [zip, setZip] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<Blob | null>(null);
  const prevUrl = useObjectUrl(preview);
  const html = faviconHtml();

  const generate = () =>
    run(async (report) => {
      const img = await loadHtmlImage(file!.file);
      const { default: JSZip } = await import('jszip');
      const z = new JSZip();
      const pngs: Record<number, Blob> = {};
      let i = 0;
      for (const [name, size] of PNG_SIZES) {
        const b = await renderSquare(img, size, useBg ? bg : null);
        pngs[size] = b;
        z.file(name, b);
        report(++i / (PNG_SIZES.length + 2));
      }
      const ico = buildIco(await Promise.all([16, 32, 48].map(async (s) => ({ size: s, png: new Uint8Array(await pngs[s].arrayBuffer()) }))));
      z.file('favicon.ico', ico);
      z.file('site.webmanifest', webManifest('My Site', useBg ? bg : '#ffffff'));
      z.file('favicon-snippet.html', html + '\n');
      report(1);
      setPreview(pngs[180]);
      setZip(await z.generateAsync({ type: 'blob' }));
    });

  return (
    <>
      {!file && (
        <SingleImagePicker onFile={setFile} onError={setError} accept={[...RASTER_IMAGE_TYPES, 'image/svg+xml']} acceptAttr="image/png,image/jpeg,image/webp,image/svg+xml" acceptLabel="PNG, JPG, WebP or SVG (square, ≥ 512 px)" />
      )}
      <ErrorBox error={error} onClose={() => setError(null)} />
      {file && (
        <>
          <ul>
            <FileRow file={file} thumb={file.file} onRemove={() => (setFile(null), setZip(null))} />
          </ul>
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox label="Fill transparent areas with a background color" checked={useBg} onChange={setUseBg} />
            {useBg && <input type="color" aria-label="Background color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-14 rounded border" />}
          </div>
          <Actions>
            <button type="button" className="btn-primary" onClick={generate} disabled={busy}>
              Generate favicons
            </button>
            <ResetButton onClick={() => (setFile(null), setZip(null))} />
          </Actions>
        </>
      )}
      {busy && <Progress value={null} />}
      {zip && (
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            {prevUrl && [16, 32, 64, 180].map((s) => <img key={s} src={prevUrl} alt={`${s}px preview`} width={s} height={s} className="checker-bg rounded" />)}
          </div>
          <button type="button" className="btn-primary" onClick={() => downloadBlob(zip, 'favicons.zip')}>
            Download favicons.zip
          </button>
          <TextArea label="HTML to paste in <head>" value={html} readOnly rows={5} />
          <CopyButton text={html} />
        </div>
      )}
    </>
  );
}
