import { useMemo, useState } from 'react';
import { Actions, ErrorBox, Notice, ResetButton } from '../../components/tools/kit';
import { runPdf } from './client';
import { flattenRanges, parsePageRanges } from './ranges';
import { baseName, PdfResult, SinglePdfInput, Thumb, usePdf, usePdfJsDoc } from './shared';

function toRangeText(sel: Set<number>): string {
  const s = [...sel].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const start = s[i];
    while (i + 1 < s.length && s[i + 1] === s[i] + 1) i++;
    parts.push(start === s[i] ? `${start + 1}` : `${start + 1}-${s[i] + 1}`);
  }
  return parts.join(', ');
}

export default function PdfExtractPages() {
  const state = usePdf();
  const { pdf } = state;
  const { doc, error: viewErr } = usePdfJsDoc(pdf?.bytes ?? null);
  const [text, setText] = useState('');
  const [out, setOut] = useState<Uint8Array | null>(null);
  const parsed = useMemo(() => {
    if (!pdf || !text.trim()) return { pages: [] as number[], err: null as string | null };
    try {
      return { pages: flattenRanges(parsePageRanges(text, pdf.pages)), err: null };
    } catch (e) {
      return { pages: [], err: e instanceof Error ? e.message : String(e) };
    }
  }, [text, pdf]);
  const selected = new Set(parsed.pages);
  const toggle = (i: number) => {
    const s = new Set(selected);
    if (s.has(i)) s.delete(i);
    else s.add(i);
    setText(toRangeText(s));
    setOut(null);
  };
  return (
    <SinglePdfInput state={state}>
      <div>
        <label className="label" htmlFor="ex-sel">
          Pages to extract
        </label>
        <input id="ex-sel" className="input font-mono" value={text} onChange={(e) => (setText(e.target.value), setOut(null))} placeholder="1, 3-5" />
      </div>
      <ErrorBox error={parsed.err || viewErr} />
      {doc && pdf && (
        <>
          {pdf.pages > 300 && <Notice>Large document: thumbnails load as you scroll.</Notice>}
          <div className="grid max-h-[32rem] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 lg:grid-cols-6">
            {Array.from({ length: pdf.pages }, (_, i) => (
              <Thumb key={i} doc={doc} page={i + 1} label={`Page ${i + 1}`} selected={selected.has(i)} onClick={() => toggle(i)} />
            ))}
          </div>
        </>
      )}
      <Actions>
        <button
          type="button"
          className="btn-primary"
          disabled={state.busy || !parsed.pages.length}
          onClick={() => state.run(async () => setOut(await runPdf<Uint8Array>('extract', [pdf!.bytes.slice(0), parsed.pages])))}
        >
          Extract {parsed.pages.length || ''} page{parsed.pages.length === 1 ? '' : 's'}
        </button>
        <ResetButton onClick={() => (state.setPdf(null), setOut(null), setText(''))} />
      </Actions>
      {out && pdf && <PdfResult bytes={out} name={`${baseName(pdf.file.name)}-extract.pdf`} />}
    </SinglePdfInput>
  );
}
