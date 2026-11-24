import { useState } from 'react';
import { Actions, DownloadButton, ErrorBox, ResetButton, TextArea, useObjectUrl } from '../../components/tools/kit';
import { detectFromBytes } from '../../lib/file-processing/detect';
import { formatBytes } from '../../lib/file-processing/format';
import { base64ToBytes } from '../developer-tools/logic';
import { basicSvgSanitize } from './logic';

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

export default function Base64ToImage() {
  const [input, setInput] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [type, setType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const url = useObjectUrl(blob);
  const decode = () => {
    setError(null);
    setBlob(null);
    try {
      if (input.length > 70_000_000) throw new Error('Input is too large (over ~50 MB of data).');
      const bytes = base64ToBytes(input);
      const detected = detectFromBytes(bytes.subarray(0, 2048));
      if (!EXT[detected]) throw new Error('The decoded data is not a recognized image format (PNG, JPEG, GIF, WebP, BMP, ICO, AVIF or SVG).');
      let data: BlobPart = bytes as unknown as BlobPart;
      if (detected === 'image/svg+xml') data = basicSvgSanitize(new TextDecoder().decode(bytes));
      setBlob(new Blob([data], { type: detected }));
      setType(detected);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <>
      <TextArea label="Base64 or data URI" value={input} onChange={setInput} rows={8} placeholder="data:image/png;base64,iVBORw0KGgo…" maxLength={70_000_001} />
      <Actions>
        <button type="button" className="btn-primary" onClick={decode} disabled={!input.trim()}>
          Decode image
        </button>
        <ResetButton onClick={() => (setInput(''), setBlob(null), setError(null))} />
      </Actions>
      <ErrorBox error={error} />
      {blob && url && (
        <div className="space-y-3">
          <img src={url} alt="Decoded" className="checker-bg max-h-96 max-w-full rounded-lg border border-slate-200 dark:border-slate-700" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {type} · {formatBytes(blob.size)}
          </p>
          <DownloadButton blob={blob} filename={`image.${EXT[type]}`} />
        </div>
      )}
    </>
  );
}
