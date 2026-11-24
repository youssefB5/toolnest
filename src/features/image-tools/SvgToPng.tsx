import { useEffect, useState } from 'react';
import { Actions, DownloadButton, ErrorBox, FileDrop, NumberInput, Progress, ResetButton, Segmented, TextArea, useObjectUrl, useTask } from '../../components/tools/kit';
import { loadHtmlImage } from '../../lib/file-processing/image';
import { checkCanvasSize } from '../../lib/file-processing/image-geometry';
import { withExtension } from '../../lib/security/url';
import { basicSvgSanitize, svgIntrinsicSize, withSvgSize } from './logic';

const MAX = 8192;

async function sanitize(svg: string): Promise<string> {
  const { default: DOMPurify } = await import('dompurify');
  const clean = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // <image> is kept, but basicSvgSanitize() neutralizes any href that is not an embedded data:image URI
    FORBID_TAGS: ['script', 'foreignObject', 'iframe'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick'],
  });
  return basicSvgSanitize(clean);
}

export default function SvgToPng() {
  const [svg, setSvg] = useState('');
  const [name, setName] = useState('image.svg');
  const [intrinsic, setIntrinsic] = useState<{ width: number; height: number } | null>(null);
  const [width, setWidth] = useState<number | ''>(1024);
  const [bgMode, setBgMode] = useState<'transparent' | 'white'>('transparent');
  const [out, setOut] = useState<Blob | null>(null);
  const outUrl = useObjectUrl(out);
  const { busy, error, setError, run } = useTask();

  useEffect(() => {
    setOut(null);
    const s = svgIntrinsicSize(svg);
    setIntrinsic(s);
  }, [svg]);

  const ratio = intrinsic ? intrinsic.height / intrinsic.width : 1;
  const w = Math.min(MAX, Number(width) || 0);
  const h = Math.max(1, Math.round(w * ratio));
  const sizeErr = w ? checkCanvasSize(w, h) : null;

  const render = () =>
    run(async () => {
      if (!/<svg[\s>]/i.test(svg)) throw new Error('This does not look like SVG markup.');
      const clean = withSvgSize(await sanitize(svg), w, h);
      const img = await loadHtmlImage(new Blob([clean], { type: 'image/svg+xml' }));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d')!;
      if (bgMode === 'white') {
        g.fillStyle = '#fff';
        g.fillRect(0, 0, w, h);
      }
      g.drawImage(img, 0, 0, w, h);
      setOut(await new Promise<Blob>((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error('PNG encoding failed'))), 'image/png')));
    });

  return (
    <>
      <FileDrop
        compact
        accept={['image/svg+xml']}
        acceptAttr=".svg,image/svg+xml"
        acceptLabel="SVG file"
        onError={setError}
        onFiles={async ([f]) => {
          setName(f.name);
          setSvg(await f.file.text());
        }}
      />
      <TextArea label="…or paste SVG markup" value={svg} onChange={setSvg} rows={7} placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">…</svg>' />
      {intrinsic && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Intrinsic size: {Math.round(intrinsic.width)} × {Math.round(intrinsic.height)}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberInput label={`Output width (max ${MAX})`} value={width} onChange={setWidth} min={1} max={MAX} step={1} suffix="px" hint={w ? `Height: ${h}px` : undefined} />
        <div>
          <span className="label">Background</span>
          <Segmented label="Background" value={bgMode} onChange={setBgMode} options={[{ value: 'transparent', label: 'Transparent' }, { value: 'white', label: 'White' }]} />
        </div>
      </div>
      <ErrorBox error={sizeErr || error} onClose={() => setError(null)} />
      <Actions>
        <button type="button" className="btn-primary" onClick={render} disabled={busy || !svg.trim() || !w || !!sizeErr}>
          Convert to PNG
        </button>
        <ResetButton onClick={() => (setSvg(''), setOut(null))} />
      </Actions>
      {busy && <Progress value={null} />}
      {out && outUrl && (
        <div className="space-y-3">
          <img src={outUrl} alt="Rendered PNG" className="checker-bg max-h-96 max-w-full rounded-lg border border-slate-200 dark:border-slate-700" />
          <DownloadButton blob={out} filename={withExtension(name, 'png')} />
        </div>
      )}
    </>
  );
}
