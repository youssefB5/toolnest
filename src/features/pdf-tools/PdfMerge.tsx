import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Actions, ErrorBox, FileDrop, FileRow, Progress, ResetButton, useTask } from '../../components/tools/kit';
import type { ValidatedFile } from '../../lib/file-processing/validate';
import { runPdf } from './client';
import { PDF_ACCEPT, PdfResult } from './shared';

export default function PdfMerge() {
  const [files, setFiles] = useState<ValidatedFile[]>([]);
  const [out, setOut] = useState<Uint8Array | null>(null);
  const { busy, progress, error, setError, run } = useTask();
  const move = (i: number, d: -1 | 1) =>
    setFiles((f) => {
      const n = [...f];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  const merge = () =>
    run(async (report) => {
      const list = await Promise.all(files.map(async (f) => ({ name: f.name, bytes: await f.file.arrayBuffer() })));
      setOut(await runPdf<Uint8Array>('merge', [list], report));
    });
  return (
    <>
      <FileDrop {...PDF_ACCEPT} multiple onFiles={(l) => (setFiles((f) => [...f, ...l]), setOut(null))} onError={setError} />
      <ErrorBox error={error} onClose={() => setError(null)} />
      {files.length > 0 && (
        <>
          <ol className="space-y-2" aria-label="Files in merge order">
            {files.map((f, i) => (
              <FileRow
                key={f.id}
                file={f}
                onRemove={busy ? undefined : () => (setFiles((x) => x.filter((y) => y.id !== f.id)), setOut(null))}
                extra={
                  <span className="flex gap-1">
                    <button type="button" className="btn-ghost btn-sm" disabled={i === 0 || busy} onClick={() => (move(i, -1), setOut(null))} aria-label={`Move ${f.name} up`}>
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button type="button" className="btn-ghost btn-sm" disabled={i === files.length - 1 || busy} onClick={() => (move(i, 1), setOut(null))} aria-label={`Move ${f.name} down`}>
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                  </span>
                }
              />
            ))}
          </ol>
          <Actions>
            <button type="button" className="btn-primary" onClick={merge} disabled={busy || files.length < 2}>
              Merge {files.length} PDFs
            </button>
            <ResetButton onClick={() => (setFiles([]), setOut(null))} />
            {files.length < 2 && <span className="text-sm text-slate-500">Add at least two files.</span>}
          </Actions>
        </>
      )}
      {busy && <Progress value={progress} />}
      {out && <PdfResult bytes={out} name="merged.pdf" />}
    </>
  );
}
