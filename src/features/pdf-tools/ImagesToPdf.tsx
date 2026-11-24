import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Actions, ErrorBox, FileDrop, FileRow, NumberInput, Progress, ResetButton, Select, useTask } from '../../components/tools/kit';
import { processImage } from '../../lib/file-processing/image';
import type { ValidatedFile } from '../../lib/file-processing/validate';
import { runPdf } from './client';
import { PdfResult } from './shared';

type Size = 'a4' | 'letter' | 'legal' | 'a5' | 'fit';

export default function ImagesToPdf() {
  const [files, setFiles] = useState<ValidatedFile[]>([]);
  const [size, setSize] = useState<Size>('a4');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<number | ''>(20);
  const [out, setOut] = useState<Uint8Array | null>(null);
  const { busy, progress, error, setError, run } = useTask();
  const move = (i: number, d: -1 | 1) =>
    setFiles((f) => {
      const n = [...f];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  const create = () =>
    run(async (report) => {
      const images = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        let blob: Blob = f.file;
        let kind: 'jpeg' | 'png' = f.type === 'image/jpeg' ? 'jpeg' : 'png';
        if (f.type !== 'image/jpeg' && f.type !== 'image/png') {
          // PDF supports JPEG and PNG only: convert other formats losslessly to PNG
          blob = await processImage(f.file, { mime: 'image/png' });
          kind = 'png';
        }
        images.push({ bytes: new Uint8Array(await blob.arrayBuffer()), kind });
        report(((i + 1) / files.length) * 0.5);
      }
      setOut(await runPdf<Uint8Array>('images', [images, { size, orientation, margin: Number(margin) || 0 }], (p) => report(0.5 + p * 0.5)));
    });
  return (
    <>
      <FileDrop multiple accept={['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']} acceptAttr="image/jpeg,image/png,image/webp,image/gif,image/bmp" acceptLabel="JPG, PNG, WebP, GIF or BMP" onFiles={(l) => (setFiles((f) => [...f, ...l]), setOut(null))} onError={setError} />
      <ErrorBox error={error} onClose={() => setError(null)} />
      {files.length > 0 && (
        <>
          <ol className="space-y-2" aria-label="Images in page order">
            {files.map((f, i) => (
              <FileRow
                key={f.id}
                file={f}
                thumb={f.file}
                onRemove={busy ? undefined : () => (setFiles((x) => x.filter((y) => y.id !== f.id)), setOut(null))}
                extra={
                  <span className="flex gap-1">
                    <button type="button" className="btn-ghost btn-sm" disabled={i === 0} onClick={() => (move(i, -1), setOut(null))} aria-label={`Move ${f.name} up`}>
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button type="button" className="btn-ghost btn-sm" disabled={i === files.length - 1} onClick={() => (move(i, 1), setOut(null))} aria-label={`Move ${f.name} down`}>
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                  </span>
                }
              />
            ))}
          </ol>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select<Size>
              label="Page size"
              value={size}
              onChange={setSize}
              options={[
                { value: 'a4', label: 'A4' },
                { value: 'letter', label: 'US Letter' },
                { value: 'legal', label: 'US Legal' },
                { value: 'a5', label: 'A5' },
                { value: 'fit', label: 'Fit to image' },
              ]}
            />
            {size !== 'fit' && (
              <Select label="Orientation" value={orientation} onChange={setOrientation} options={[{ value: 'auto', label: 'Automatic' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
            )}
            <NumberInput label="Margin" value={margin} onChange={setMargin} min={0} max={144} step={1} suffix="pt" />
          </div>
          <Actions>
            <button type="button" className="btn-primary" onClick={create} disabled={busy}>
              Create PDF
            </button>
            <ResetButton onClick={() => (setFiles([]), setOut(null))} />
          </Actions>
        </>
      )}
      {busy && <Progress value={progress} />}
      {out && <PdfResult bytes={out} name="images.pdf" />}
    </>
  );
}
