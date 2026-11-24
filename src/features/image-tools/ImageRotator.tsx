import { useState } from 'react';
import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from 'lucide-react';
import { Actions, DownloadButton, ErrorBox, FileRow, Progress, ResetButton, useObjectUrl } from '../../components/tools/kit';
import { processImage } from '../../lib/file-processing/image';
import { extForMime, normalizeRotation } from '../../lib/file-processing/image-geometry';
import { withSuffix } from '../../lib/security/url';
import { outputMimeFor, SingleImagePicker, useSingleImage } from './shared';

export default function ImageRotator() {
  const { file, setFile, busy, error, setError, run } = useSingleImage();
  const url = useObjectUrl(file?.file);
  const [rot, setRot] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [out, setOut] = useState<Blob | null>(null);
  const outUrl = useObjectUrl(out);
  const mime = file ? outputMimeFor(file.type) : 'image/png';
  const change = (fn: () => void) => {
    fn();
    setOut(null);
  };
  return (
    <>
      {!file && <SingleImagePicker onFile={setFile} onError={setError} />}
      <ErrorBox error={error} onClose={() => setError(null)} />
      {file && url && (
        <>
          <ul>
            <FileRow file={file} onRemove={() => setFile(null)} />
          </ul>
          <Actions>
            <button type="button" className="btn-secondary" onClick={() => change(() => setRot((r) => r - 90))}>
              <RotateCcw className="size-4" aria-hidden="true" /> Rotate left
            </button>
            <button type="button" className="btn-secondary" onClick={() => change(() => setRot((r) => r + 90))}>
              <RotateCw className="size-4" aria-hidden="true" /> Rotate right
            </button>
            <button type="button" className="btn-secondary" onClick={() => change(() => setRot((r) => r + 180))}>
              180°
            </button>
            <button type="button" className="btn-secondary" aria-pressed={flipH} onClick={() => change(() => setFlipH((v) => !v))}>
              <FlipHorizontal className="size-4" aria-hidden="true" /> Flip horizontal
            </button>
            <button type="button" className="btn-secondary" aria-pressed={flipV} onClick={() => change(() => setFlipV((v) => !v))}>
              <FlipVertical className="size-4" aria-hidden="true" /> Flip vertical
            </button>
          </Actions>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Rotation: {normalizeRotation(rot)}° {flipH && '· flipped horizontally'} {flipV && '· flipped vertically'}
          </p>
          <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-6 dark:bg-slate-900">
            <img
              src={url}
              alt="Preview"
              className="max-h-80 max-w-full transition-transform duration-200"
              style={{ transform: `rotate(${rot}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})` }}
            />
          </div>
          <Actions>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => run(async () => setOut(await processImage(file.file, { mime, quality: 0.92, rotate: normalizeRotation(rot), flipH, flipV })))}
            >
              Apply
            </button>
            <ResetButton onClick={() => (setFile(null), setRot(0), setFlipH(false), setFlipV(false), setOut(null))} />
          </Actions>
        </>
      )}
      {busy && <Progress value={null} />}
      {out && outUrl && file && (
        <div className="space-y-3">
          <img src={outUrl} alt="Rotated result" className="max-h-64 rounded-lg border border-slate-200 dark:border-slate-700" />
          <DownloadButton blob={out} filename={withSuffix(file.name, 'rotated', extForMime(mime))} />
        </div>
      )}
    </>
  );
}
