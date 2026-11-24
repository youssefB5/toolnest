import { useEffect, useState } from 'react';
import { Actions, CopyButton, DownloadButton, ErrorBox, FileDrop, FileRow, Notice, ResetButton, Segmented, TextArea, useObjectUrl } from '../../components/tools/kit';
import { RASTER_IMAGE_TYPES } from '../../lib/file-processing/detect';
import { formatBytes } from '../../lib/file-processing/format';
import type { ValidatedFile } from '../../lib/file-processing/validate';
import { withExtension } from '../../lib/security/url';

type Style = 'raw' | 'datauri' | 'html' | 'css';

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(blob);
  });
}

export default function ImageToBase64() {
  const [file, setFile] = useState<ValidatedFile | null>(null);
  const [dataUrl, setDataUrl] = useState('');
  const [style, setStyle] = useState<Style>('datauri');
  const [error, setError] = useState<string | null>(null);
  const preview = useObjectUrl(file?.file);
  useEffect(() => {
    if (!file) return setDataUrl('');
    // use the detected type rather than the extension-derived one
    readAsDataUrl(new Blob([file.file], { type: file.type }))
      .then(setDataUrl)
      .catch((e) => setError(e.message));
  }, [file]);
  const raw = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const out = !dataUrl ? '' : style === 'raw' ? raw : style === 'datauri' ? dataUrl : style === 'html' ? `<img src="${dataUrl}" alt="">` : `background-image: url("${dataUrl}");`;
  return (
    <>
      {!file && (
        <FileDrop
          accept={[...RASTER_IMAGE_TYPES, 'image/svg+xml']}
          acceptAttr="image/*"
          acceptLabel="Any image (JPG, PNG, WebP, GIF, SVG, ICO…)"
          onFiles={([f]) => setFile(f)}
          onError={setError}
        />
      )}
      <ErrorBox error={error} onClose={() => setError(null)} />
      {file && (
        <>
          <ul>
            <FileRow file={file} onRemove={() => setFile(null)} />
          </ul>
          {preview && file.type !== 'image/svg+xml' && <img src={preview} alt="Selected" className="checker-bg max-h-40 rounded-lg" />}
          {file.size > 100 * 1024 && <Notice tone="warn">This image is {formatBytes(file.size)}. Inlining images larger than a few KB usually hurts page performance.</Notice>}
          <Segmented
            label="Output style"
            value={style}
            onChange={setStyle}
            options={[
              { value: 'datauri', label: 'Data URI' },
              { value: 'raw', label: 'Raw Base64' },
              { value: 'html', label: '<img> tag' },
              { value: 'css', label: 'CSS' },
            ]}
          />
          <TextArea label={`Output (${out.length.toLocaleString()} characters)`} value={out} readOnly rows={8} />
          <Actions>
            <CopyButton text={out} />
            <DownloadButton text={out} filename={withExtension(file.name, 'txt')} primary={false} />
            <ResetButton onClick={() => setFile(null)} />
          </Actions>
        </>
      )}
    </>
  );
}
