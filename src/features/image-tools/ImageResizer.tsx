import { useEffect, useState } from 'react';
import { Actions, Checkbox, DownloadButton, ErrorBox, FileRow, NumberInput, Progress, Range, ResetButton, Select, useObjectUrl } from '../../components/tools/kit';
import { imageSize, processImage } from '../../lib/file-processing/image';
import { checkCanvasSize, extForMime, fitDimensions } from '../../lib/file-processing/image-geometry';
import { formatBytes } from '../../lib/file-processing/format';
import { withSuffix } from '../../lib/security/url';
import { outputMimeFor, SingleImagePicker, useSingleImage } from './shared';

const PRESETS = [
  { label: 'Full HD 1920×1080', w: 1920, h: 1080 },
  { label: 'HD 1280×720', w: 1280, h: 720 },
  { label: 'Instagram post 1080×1080', w: 1080, h: 1080 },
  { label: 'Instagram story 1080×1920', w: 1080, h: 1920 },
  { label: 'Open Graph 1200×630', w: 1200, h: 630 },
  { label: 'YouTube thumbnail 1280×720', w: 1280, h: 720 },
  { label: 'Profile picture 400×400', w: 400, h: 400 },
];

export default function ImageResizer() {
  const { file, setFile, busy, error, setError, run } = useSingleImage();
  const [orig, setOrig] = useState<{ width: number; height: number } | null>(null);
  const [w, setW] = useState<number | ''>('');
  const [h, setH] = useState<number | ''>('');
  const [lock, setLock] = useState(true);
  const [percent, setPercent] = useState(100);
  const [mode, setMode] = useState<'pixels' | 'percent'>('pixels');
  const [format, setFormat] = useState<'same' | 'image/jpeg' | 'image/png' | 'image/webp'>('same');
  const [out, setOut] = useState<Blob | null>(null);
  const outUrl = useObjectUrl(out);

  useEffect(() => {
    setOut(null);
    if (!file) return setOrig(null);
    imageSize(file.file)
      .then((s) => {
        setOrig(s);
        setW(s.width);
        setH(s.height);
      })
      .catch((e) => setError(e.message));
  }, [file, setError]);

  const target =
    orig && (mode === 'percent'
      ? { width: Math.max(1, Math.round((orig.width * percent) / 100)), height: Math.max(1, Math.round((orig.height * percent) / 100)) }
      : fitDimensions(orig.width, orig.height, { width: w === '' ? null : w, height: h === '' ? null : h, lock: false }));
  const sizeErr = target ? checkCanvasSize(target.width, target.height) : null;
  const mime = file ? (format === 'same' ? outputMimeFor(file.type) : format) : 'image/png';

  const onW = (v: number | '') => {
    setW(v);
    if (lock && orig && v !== '') setH(Math.max(1, Math.round((Number(v) * orig.height) / orig.width)));
  };
  const onH = (v: number | '') => {
    setH(v);
    if (lock && orig && v !== '') setW(Math.max(1, Math.round((Number(v) * orig.width) / orig.height)));
  };

  return (
    <>
      {!file && <SingleImagePicker onFile={setFile} onError={setError} />}
      <ErrorBox error={error} onClose={() => setError(null)} />
      {file && orig && (
        <>
          <ul>
            <FileRow file={file} thumb={file.file} onRemove={() => setFile(null)} extra={<span className="text-xs text-slate-500">{orig.width}×{orig.height}</span>} />
          </ul>
          <Select label="Resize by" value={mode} onChange={setMode} options={[{ value: 'pixels', label: 'Pixels' }, { value: 'percent', label: 'Percentage' }]} />
          {mode === 'pixels' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberInput label="Width" value={w} onChange={onW} min={1} step={1} suffix="px" />
                <NumberInput label="Height" value={h} onChange={onH} min={1} step={1} suffix="px" />
                <div className="flex items-end pb-2">
                  <Checkbox label="Lock aspect ratio" checked={lock} onChange={setLock} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Presets">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      if (lock) {
                        const fit = fitDimensions(orig.width, orig.height, { width: p.w, height: p.h, lock: true });
                        setW(fit.width);
                        setH(fit.height);
                      } else {
                        setW(p.w);
                        setH(p.h);
                      }
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Range label="Scale" value={percent} onChange={setPercent} min={1} max={400} format={(v) => `${v}%`} />
          )}
          <Select
            label="Output format"
            value={format}
            onChange={setFormat}
            options={[
              { value: 'same', label: 'Same as original' },
              { value: 'image/jpeg', label: 'JPEG' },
              { value: 'image/png', label: 'PNG' },
              { value: 'image/webp', label: 'WebP' },
            ]}
          />
          {target && <p className="text-sm text-slate-600 dark:text-slate-400">Output: {target.width} × {target.height} px</p>}
          <ErrorBox error={sizeErr} />
          <Actions>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || !target || !!sizeErr}
              onClick={() => run(async () => setOut(await processImage(file.file, { mime, quality: 0.92, width: target!.width, height: target!.height })))}
            >
              Resize image
            </button>
            <ResetButton onClick={() => (setFile(null), setOut(null))} />
          </Actions>
        </>
      )}
      {busy && <Progress value={null} />}
      {out && outUrl && file && (
        <div className="space-y-3">
          <img src={outUrl} alt="Resized result" className="checker-bg max-h-96 rounded-lg border border-slate-200 object-contain dark:border-slate-700" />
          <p className="text-sm">
            {target?.width}×{target?.height} px · {formatBytes(out.size)}
          </p>
          <DownloadButton blob={out} filename={withSuffix(file.name, `${target?.width}x${target?.height}`, extForMime(mime))} />
        </div>
      )}
    </>
  );
}
