import { useEffect, useState } from 'react';
import { ErrorBox, FileRow, Notice, Progress, ResetButton } from '../../components/tools/kit';
import { RASTER_IMAGE_TYPES } from '../../lib/file-processing/detect';
import { imageSize } from '../../lib/file-processing/image';
import { formatBytes } from '../../lib/file-processing/format';
import { SingleImagePicker, useSingleImage } from './shared';

type Row = [string, string];
const SENSITIVE = /gps|latitude|longitude|serial|owner|artist|copyright|maker ?note|user ?comment|camera ?owner/i;

function fmt(v: unknown): string {
  if (v instanceof Date) return v.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
  if (v instanceof Uint8Array || ArrayBuffer.isView(v)) return `[binary, ${(v as ArrayBufferView).byteLength} bytes]`;
  if (Array.isArray(v)) return v.length > 12 ? `[${v.slice(0, 12).join(', ')}, …]` : v.join(', ');
  if (v && typeof v === 'object') return JSON.stringify(v).slice(0, 300);
  return String(v);
}

export default function ImageMetadataViewer() {
  const { file, setFile, busy, error, setError, run } = useSingleImage();
  const [groups, setGroups] = useState<{ name: string; rows: Row[] }[]>([]);
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    setGroups([]);
    setGps(null);
    if (!file) return;
    run(async () => {
      const exifr = (await import('exifr')).default;
      const basic: Row[] = [
        ['File name', file.name],
        ['File size', formatBytes(file.size)],
        ['Detected type', file.type],
        ['Last modified', new Date(file.file.lastModified).toISOString().slice(0, 19).replace('T', ' ')],
      ];
      try {
        const s = await imageSize(file.file);
        basic.push(['Dimensions', `${s.width} × ${s.height} px`]);
      } catch {
        /* HEIC etc. may not decode */
      }
      const out = [{ name: 'File', rows: basic }];
      let data: Record<string, unknown> | undefined;
      try {
        data = await exifr.parse(file.file, { tiff: true, exif: true, gps: true, ifd0: {}, ifd1: false, xmp: true, iptc: true, icc: false, interop: false, mergeOutput: false, translateValues: true, reviveValues: true });
      } catch {
        data = undefined;
      }
      if (data) {
        for (const [section, val] of Object.entries(data)) {
          if (!val || typeof val !== 'object') continue;
          const rows = Object.entries(val as Record<string, unknown>)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, fmt(v)] as Row);
          if (rows.length) out.push({ name: section.toUpperCase(), rows });
        }
      }
      try {
        const g = await exifr.gps(file.file);
        if (g && Number.isFinite(g.latitude) && Number.isFinite(g.longitude)) setGps({ lat: g.latitude, lon: g.longitude });
      } catch {
        /* no gps */
      }
      setGroups(out);
    });
  }, [file, run]);

  return (
    <>
      {!file && <SingleImagePicker onFile={setFile} onError={setError} accept={[...RASTER_IMAGE_TYPES, 'image/heic', 'image/tiff']} acceptAttr="image/*,.heic,.tif,.tiff" acceptLabel="JPG, PNG, WebP, HEIC or TIFF" />}
      <ErrorBox error={error} onClose={() => setError(null)} />
      {file && (
        <>
          <ul>
            <FileRow file={file} thumb={file.type === 'image/heic' || file.type === 'image/tiff' ? null : file.file} onRemove={() => setFile(null)} />
          </ul>
          {busy && <Progress value={null} />}
          {gps && (
            <Notice tone="warn">
              This photo contains a GPS location: {gps.lat.toFixed(6)}, {gps.lon.toFixed(6)}. Anyone you share the original file with can see where it was taken.
              Use the Image Metadata Remover to strip it.
            </Notice>
          )}
          {!busy && groups.length === 1 && <Notice>No EXIF, GPS, XMP or IPTC metadata was found in this file.</Notice>}
          {groups.map((g) => (
            <section key={g.name}>
              <h3 className="mb-2 text-sm font-semibold">{g.name}</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <tbody>
                    {g.rows.map(([k, v]) => (
                      <tr key={k} className={`border-t border-slate-100 first:border-0 dark:border-slate-800 ${SENSITIVE.test(k) ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}>
                        <th className="w-1/3 px-3 py-1.5 text-start font-medium text-slate-600 dark:text-slate-400">{k}</th>
                        <td className="px-3 py-1.5 font-mono text-xs break-all">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          <ResetButton onClick={() => setFile(null)} />
        </>
      )}
    </>
  );
}
