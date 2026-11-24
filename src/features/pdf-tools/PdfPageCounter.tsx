import { useState } from 'react';
import { Actions, ErrorBox, FileDrop, Progress, ResetButton, useTask } from '../../components/tools/kit';
import { formatBytes } from '../../lib/file-processing/format';
import { runPdf } from './client';
import { PDF_ACCEPT } from './shared';

interface Row {
  id: string;
  name: string;
  size: number;
  pages: number | null;
  error?: string;
}

export default function PdfPageCounter() {
  const [rows, setRows] = useState<Row[]>([]);
  const { busy, progress, error, setError, run } = useTask();
  const total = rows.reduce((s, r) => s + (r.pages ?? 0), 0);
  return (
    <>
      <FileDrop
        {...PDF_ACCEPT}
        multiple
        maxFiles={200}
        onError={setError}
        onFiles={(list) =>
          run(async (report) => {
            const out: Row[] = [];
            for (let i = 0; i < list.length; i++) {
              const f = list[i];
              try {
                out.push({ id: f.id, name: f.name, size: f.size, pages: await runPdf<number>('count', [await f.file.arrayBuffer(), `“${f.name}”`]) });
              } catch (e) {
                out.push({ id: f.id, name: f.name, size: f.size, pages: null, error: e instanceof Error ? e.message : String(e) });
              }
              report((i + 1) / list.length);
            }
            setRows((r) => [...r, ...out]);
          })
        }
      />
      <ErrorBox error={error} onClose={() => setError(null)} />
      {busy && <Progress value={progress} />}
      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">File</th>
                  <th className="px-3 py-2 text-end font-medium">Size</th>
                  <th className="px-3 py-2 text-end font-medium">Pages</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="max-w-xs truncate px-3 py-2" title={r.name}>
                      {r.name}
                      {r.error && <span className="block text-xs text-red-600">{r.error}</span>}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">{formatBytes(r.size)}</td>
                    <td className="px-3 py-2 text-end font-semibold tabular-nums">{r.pages ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold dark:border-slate-700">
                  <td className="px-3 py-2">Total ({rows.length} files)</td>
                  <td />
                  <td className="px-3 py-2 text-end tabular-nums">{total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Actions>
            <ResetButton onClick={() => setRows([])} />
          </Actions>
        </>
      )}
    </>
  );
}
