import { useEffect, useRef, useState } from 'react';
import { Actions, CopyButton, ErrorBox, FileRow, ResetButton } from '../../components/tools/kit';
import { RASTER_IMAGE_TYPES } from '../../lib/file-processing/detect';
import { loadHtmlImage } from '../../lib/file-processing/image';
import { rgbToHsl } from '../converter-tools/logic';
import { rgbToHexStr } from './logic';
import { SingleImagePicker, useSingleImage } from './shared';

interface Picked {
  hex: string;
  rgb: string;
  hsl: string;
}

export default function ImageColorPicker() {
  const { file, setFile, error, setError } = useSingleImage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [current, setCurrent] = useState<Picked | null>(null);
  const [history, setHistory] = useState<Picked[]>([]);

  useEffect(() => {
    if (!file) return setDims(null);
    loadHtmlImage(file.file)
      .then((img) => {
        const max = 4096;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const c = canvasRef.current!;
        c.width = w;
        c.height = h;
        c.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, w, h);
        setDims({ w, h });
        setCursor({ x: Math.floor(w / 2), y: Math.floor(h / 2) });
      })
      .catch((e) => setError(e.message));
  }, [file, setError]);

  const sample = (x: number, y: number): Picked | null => {
    const c = canvasRef.current;
    if (!c || !dims) return null;
    const [r, g, b] = c.getContext('2d', { willReadFrequently: true })!.getImageData(Math.min(dims.w - 1, Math.max(0, x)), Math.min(dims.h - 1, Math.max(0, y)), 1, 1).data;
    const hsl = rgbToHsl({ r, g, b });
    return { hex: rgbToHexStr(r, g, b), rgb: `rgb(${r}, ${g}, ${b})`, hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` };
  };
  const pos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - rect.left) / rect.width) * dims!.w), y: Math.floor(((e.clientY - rect.top) / rect.height) * dims!.h) };
  };
  const pick = (x: number, y: number) => {
    const p = sample(x, y);
    if (!p) return;
    setCurrent(p);
    setHistory((h) => [p, ...h.filter((q) => q.hex !== p.hex)].slice(0, 12));
  };
  return (
    <>
      {!file && <SingleImagePicker onFile={setFile} onError={setError} accept={[...RASTER_IMAGE_TYPES, 'image/svg+xml']} acceptAttr="image/*" acceptLabel="JPG, PNG, WebP, GIF or SVG" />}
      <ErrorBox error={error} onClose={() => setError(null)} />
      {file && (
        <ul>
          <FileRow file={file} onRemove={() => (setFile(null), setCurrent(null))} />
        </ul>
      )}
      <div className={file ? 'grid gap-6 lg:grid-cols-[1fr_16rem]' : 'hidden'}>
        <div>
          <canvas
            ref={canvasRef}
            tabIndex={0}
            role="img"
            aria-label="Image. Click or press Enter to pick the color under the cursor; use arrow keys to move."
            className="max-h-[32rem] max-w-full cursor-crosshair rounded-lg border border-slate-200 focus-visible:outline-2 dark:border-slate-700"
            onMouseMove={(e) => dims && setCurrent(sample(pos(e).x, pos(e).y))}
            onClick={(e) => {
              const p = pos(e);
              setCursor(p);
              pick(p.x, p.y);
            }}
            onKeyDown={(e) => {
              if (!dims) return;
              const step = e.shiftKey ? 10 : 1;
              const m: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
              if (m[e.key]) {
                e.preventDefault();
                const n = { x: Math.min(dims.w - 1, Math.max(0, cursor.x + m[e.key][0])), y: Math.min(dims.h - 1, Math.max(0, cursor.y + m[e.key][1])) };
                setCursor(n);
                setCurrent(sample(n.x, n.y));
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pick(cursor.x, cursor.y);
              }
            }}
          />
          {dims && (
            <p className="mt-1 text-xs text-slate-500">
              Keyboard cursor: {cursor.x}, {cursor.y}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {current && (
            <>
              <div className="h-20 rounded-lg border border-slate-200 dark:border-slate-700" style={{ background: current.hex }} aria-hidden="true" />
              {(['hex', 'rgb', 'hsl'] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <code className="font-mono text-sm">{current[k]}</code>
                  <CopyButton text={current[k]} />
                </div>
              ))}
            </>
          )}
          {history.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Picked colors</h3>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h) => (
                  <button key={h.hex} type="button" title={h.hex} aria-label={`Select ${h.hex}`} className="size-8 rounded-md border border-slate-300" style={{ background: h.hex }} onClick={() => setCurrent(h)} />
                ))}
              </div>
              <Actions>
                <CopyButton text={history.map((h) => h.hex).join(', ')} label="Copy palette" />
                <ResetButton onClick={() => setHistory([])} />
              </Actions>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
