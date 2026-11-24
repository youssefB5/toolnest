/** Approximate search-result preview (titles over ~60 chars are usually truncated). */
export function SeoPreview({ title, description, path }: { title: string; description: string; path: string }) {
  const origin = typeof location !== 'undefined' ? location.origin : 'https://example.com';
  const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  return (
    <figure className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950" aria-label="Search result preview">
      <figcaption className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Search preview</figcaption>
      <div className="truncate text-xs text-slate-600 dark:text-slate-400">
        {origin}
        {path}
      </div>
      <div className="mt-0.5 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{cut(title, 62)}</div>
      <p className="mt-0.5 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{cut(description, 160)}</p>
      {title.length > 62 && <p className="mt-2 text-xs text-amber-600">Title is {title.length} characters; search engines usually show about 60.</p>}
    </figure>
  );
}
