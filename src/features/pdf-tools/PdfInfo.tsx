import { useEffect, useState } from 'react';
import { CopyButton, ResetButton } from '../../components/tools/kit';
import { formatBytes } from '../../lib/file-processing/format';
import { runPdf } from './client';
import { paperName, type PdfInfo as Info } from './logic';
import { SinglePdfInput, usePdf } from './shared';

const mm = (pt: number) => Math.round((pt / 72) * 25.4);

export default function PdfInfo() {
  const state = usePdf();
  const { pdf, run } = state;
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    setInfo(null);
    if (pdf) run(async () => setInfo(await runPdf<Info>('info', [pdf.bytes.slice(0)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf]);
  const rows: [string, string][] = info
    ? [
        ['File size', formatBytes(pdf!.file.size)],
        ['PDF version', info.version ?? 'Unknown'],
        ['Pages', String(info.pageCount)],
        ['Title', info.title || '—'],
        ['Author', info.author || '—'],
        ['Subject', info.subject || '—'],
        ['Keywords', info.keywords || '—'],
        ['Creator (application)', info.creator || '—'],
        ['Producer', info.producer || '—'],
        ['Created', info.creationDate ?? '—'],
        ['Modified', info.modificationDate ?? '—'],
      ]
    : [];
  const uniqueSizes = info ? [...new Map(info.pageSizes.map((s) => [`${s.width}x${s.height}r${s.rotation}`, s])).values()] : [];
  return (
    <SinglePdfInput state={state}>
      {info && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-t border-slate-100 first:border-0 dark:border-slate-800">
                    <th className="w-1/3 px-3 py-2 text-start font-medium text-slate-600 dark:text-slate-400">{k}</th>
                    <td className="px-3 py-2 break-all">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section>
            <h3 className="mb-2 text-sm font-semibold">Page sizes</h3>
            <ul className="space-y-1 text-sm">
              {uniqueSizes.map((s) => {
                const count = info.pageSizes.filter((p) => p.width === s.width && p.height === s.height && p.rotation === s.rotation).length;
                return (
                  <li key={`${s.width}x${s.height}r${s.rotation}`}>
                    {s.width} × {s.height} pt ({mm(s.width)} × {mm(s.height)} mm){paperName(s.width, s.height) ? ` — ${paperName(s.width, s.height)}` : ''}
                    {s.rotation ? `, rotated ${s.rotation}°` : ''} · {count} page{count === 1 ? '' : 's'}
                  </li>
                );
              })}
            </ul>
          </section>
          <div className="flex gap-2">
            <CopyButton text={rows.map(([k, v]) => `${k}: ${v}`).join('\n')} label="Copy properties" />
            <ResetButton onClick={() => state.setPdf(null)} />
          </div>
        </>
      )}
    </SinglePdfInput>
  );
}
