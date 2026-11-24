import { useEffect, useRef, useState } from 'react';
import { Actions, DownloadButton, ErrorBox, FileRow, NumberInput, Progress, ResetButton, Segmented, useObjectUrl } from '../../components/tools/kit';
import { imageSize, processImage } from '../../lib/file-processing/image';
import { clampCrop, extForMime, type CropRect } from '../../lib/file-processing/image-geometry';
import { withSuffix } from '../../lib/security/url';
import { outputMimeFor, SingleImagePicker, useSingleImage } from './shared';

const RATIOS = [
  { value: 'free', label: 'Free', r: null },
  { value: '1:1', label: '1:1', r: 1 },
  { value: '4:3', label: '4:3', r: 4 / 3 },
  { value: '3:2', label: '3:2', r: 3 / 2 },
  { value: '16:9', label: '16:9', r: 16 / 9 },
  { value: '9:16', label: '9:16', r: 9 / 16 },
] as const;
type RatioKey = (typeof RATIOS)[number]['value'];

export default function ImageCropper() {
  const { file, setFile, busy, error, setError, run } = useSingleImage();
  const url = useObjectUrl(file?.file);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [ratio, setRatio] = useState<RatioKey>('free');
  const [out, setOut] = useState<Blob | null>(null);
  const outUrl = useObjectUrl(out);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: 'new' | 'move'; sx: number; sy: number; start: CropRect } | null>(null);
  const r = RATIOS.find((x) => x.value === ratio)!.r;

  useEffect(() => {
    setOut(null);
    if (!file) return setSize(null);
    imageSize(file.file)
      .then((s) => {
        setSize(s);
        setCrop({ x: Math.round(s.width * 0.1), y: Math.round(s.height * 0.1), width: Math.round(s.width * 0.8), height: Math.round(s.height * 0.8) });
      })
      .catch((e) => setError(e.message));
  }, [file, setError]);

  // enforce ratio when changed
  useEffect(() => {
    if (!crop || !size || !r) return;
    let width = crop.width;
    let height = Math.round(width / r);
    if (crop.y + height > size.height) {
      height = size.height - crop.y;
      width = Math.round(height * r);
    }
    setCrop(clampCrop({ ...crop, width, height }, size.width, size.height));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);

  const toImg = (e: React.PointerEvent) => {
    const rect = boxRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * size!.width, y: ((e.clientY - rect.top) / rect.height) * size!.height };
  };
  const onDown = (e: React.PointerEvent) => {
    if (!size || !crop) return;
    const p = toImg(e);
    const inside = p.x >= crop.x && p.x <= crop.x + crop.width && p.y >= crop.y && p.y <= crop.y + crop.height;
    drag.current = { mode: inside ? 'move' : 'new', sx: p.x, sy: p.y, start: crop };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !size) return;
    const p = toImg(e);
    if (d.mode === 'move') {
      const x = Math.min(Math.max(0, d.start.x + p.x - d.sx), size.width - d.start.width);
      const y = Math.min(Math.max(0, d.start.y + p.y - d.sy), size.height - d.start.height);
      setCrop({ ...d.start, x, y });
    } else {
      let w = Math.abs(p.x - d.sx);
      let h = Math.abs(p.y - d.sy);
      if (r) h = w / r;
      const x = p.x < d.sx ? d.sx - w : d.sx;
      const y = (r ? p.y < d.sy : p.y < d.sy) ? d.sy - h : d.sy;
      if (w < 2 || h < 2) return;
      w = Math.min(w, size.width - Math.max(0, x));
      h = r ? w / r : Math.min(h, size.height - Math.max(0, y));
      setCrop(clampCrop({ x, y, width: w, height: h }, size.width, size.height));
    }
  };
  const onUp = () => (drag.current = null);
  const setField = (k: keyof CropRect) => (v: number | '') => size && crop && setCrop(clampCrop({ ...crop, [k]: Number(v) || 0 }, size.width, size.height));
  const mime = file ? outputMimeFor(file.type) : 'image/png';
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <>
      {!file && <SingleImagePicker onFile={setFile} onError={setError} />}
      <ErrorBox error={error} onClose={() => setError(null)} />
      {file && size && crop && url && (
        <>
          <ul>
            <FileRow file={file} onRemove={() => setFile(null)} extra={<span className="text-xs text-slate-500">{size.width}×{size.height}</span>} />
          </ul>
          <Segmented label="Aspect ratio" value={ratio} onChange={setRatio} options={RATIOS.map((x) => ({ value: x.value, label: x.label }))} />
          <div className="flex justify-center">
            <div
              ref={boxRef}
              className="checker-bg relative inline-block max-w-full cursor-crosshair touch-none select-none"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <img src={url} alt="Image to crop" className="block max-h-[28rem] max-w-full" draggable={false} />
              <div className="pointer-events-none absolute inset-0 bg-black/45" style={{ clipPath: `polygon(0 0,100% 0,100% 100%,0 100%,0 0,${pct(crop.x, size.width)} ${pct(crop.y, size.height)},${pct(crop.x, size.width)} ${pct(crop.y + crop.height, size.height)},${pct(crop.x + crop.width, size.width)} ${pct(crop.y + crop.height, size.height)},${pct(crop.x + crop.width, size.width)} ${pct(crop.y, size.height)},${pct(crop.x, size.width)} ${pct(crop.y, size.height)})` }} />
              <div
                className="pointer-events-none absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.5)]"
                style={{ left: pct(crop.x, size.width), top: pct(crop.y, size.height), width: pct(crop.width, size.width), height: pct(crop.height, size.height) }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumberInput label="X" value={crop.x} onChange={setField('x')} min={0} step={1} />
            <NumberInput label="Y" value={crop.y} onChange={setField('y')} min={0} step={1} />
            <NumberInput label="Width" value={crop.width} onChange={setField('width')} min={1} step={1} />
            <NumberInput label="Height" value={crop.height} onChange={setField('height')} min={1} step={1} />
          </div>
          <Actions>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => run(async () => setOut(await processImage(file.file, { mime, quality: 0.92, crop })))}>
              Crop image
            </button>
            <ResetButton onClick={() => (setFile(null), setOut(null))} />
          </Actions>
        </>
      )}
      {busy && <Progress value={null} />}
      {out && outUrl && file && crop && (
        <div className="space-y-3">
          <img src={outUrl} alt="Cropped result" className="checker-bg max-h-80 rounded-lg border border-slate-200 dark:border-slate-700" />
          <DownloadButton blob={out} filename={withSuffix(file.name, 'cropped', extForMime(mime))} />
        </div>
      )}
    </>
  );
}
