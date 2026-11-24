import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X, Clock, Star } from 'lucide-react';
import { search, type SearchDoc } from '../../lib/search/fuzzy';
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '../../lib/storage/local';

interface Labels {
  placeholder: string;
  label: string;
  noResults: string;
  recent: string;
  suggested: string;
  clear: string;
  hint: string;
}

interface Props {
  indexUrl: string;
  labels: Labels;
  compact?: boolean;
  large?: boolean;
  /** Bind the "/" keyboard shortcut to this instance */
  shortcut?: boolean;
}

let indexPromise: Promise<SearchDoc[]> | null = null;
function loadIndex(url: string) {
  indexPromise ??= fetch(url, { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : []))
    .then((j) => (Array.isArray(j) ? (j as SearchDoc[]) : []))
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}

export default function SearchBox({ indexUrl, labels, compact = false, large = false, shortcut = false }: Props) {
  const [docs, setDocs] = useState<SearchDoc[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const ensure = useCallback(() => {
    loadIndex(indexUrl).then(setDocs);
    setRecent(getRecentSearches());
  }, [indexUrl]);

  useEffect(() => {
    if (!shortcut && !compact) return;
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (e.key === '/' && !/input|textarea|select/i.test(tgt.tagName) && !tgt.isContentEditable) {
        if (inputRef.current && inputRef.current.offsetParent !== null) {
          e.preventDefault();
          inputRef.current.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut, compact]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = useMemo(() => search(docs, q, 8), [docs, q]);
  const suggestions = useMemo(() => docs.filter((d) => d.popular).slice(0, 5), [docs]);
  const showEmpty = q.trim().length > 0 && docs.length > 0 && results.length === 0;
  const items: { type: 'doc'; doc: SearchDoc }[] | { type: 'recent'; text: string }[] =
    q.trim() ? (showEmpty ? suggestions : results).map((doc) => ({ type: 'doc' as const, doc })) : [];
  const recentItems = !q.trim() ? recent.map((text) => ({ type: 'recent' as const, text })) : [];
  const suggestedItems = !q.trim() ? suggestions.map((doc) => ({ type: 'doc' as const, doc })) : [];
  const flat = [...(items as { type: 'doc'; doc: SearchDoc }[]), ...recentItems, ...suggestedItems];

  function go(i: number) {
    const it = flat[i];
    if (!it) return;
    if (it.type === 'recent') {
      setQ(it.text);
      setActive(-1);
      inputRef.current?.focus();
      return;
    }
    if (q.trim()) addRecentSearch(q);
    window.location.href = it.doc.href;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (flat.length ? (a + 1) % flat.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : -1));
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        go(active);
      } else if (results[0]) {
        e.preventDefault();
        addRecentSearch(q);
        window.location.href = results[0].href;
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  const optionId = (i: number) => `${listId}-opt-${i}`;
  let idx = -1;
  const renderDoc = (doc: SearchDoc) => {
    idx++;
    const i = idx;
    return (
      <li
        key={`d-${doc.id}-${i}`}
        id={optionId(i)}
        role="option"
        aria-selected={active === i}
        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${active === i ? 'bg-brand-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
        onMouseEnter={() => setActive(i)}
        onMouseDown={(e) => {
          e.preventDefault();
          go(i);
        }}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{doc.title}</span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{doc.categoryTitle}</span>
        </span>
      </li>
    );
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <label className="sr-only" htmlFor={`${listId}-input`}>
        {labels.label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className={`pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 ${large ? 'size-5' : 'size-4'}`}
        />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={labels.placeholder}
          value={q}
          maxLength={100}
          onFocus={() => {
            ensure();
            setOpen(true);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={`input ps-10 ${large ? 'h-14 rounded-xl text-base shadow-[var(--shadow-card)]' : compact ? 'h-10' : 'h-11'}`}
        />
        {compact && !q && (
          <kbd className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 lg:inline">/</kbd>
        )}
        {q && (
          <button
            type="button"
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
            aria-label={labels.clear}
            onClick={() => {
              setQ('');
              inputRef.current?.focus();
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (flat.length > 0 || showEmpty) && (
        <div className="card absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto p-2 shadow-[var(--shadow-pop)]">
          {showEmpty && <p className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{labels.noResults.replace('{q}', q)}</p>}
          <ul id={listId} role="listbox" aria-label={labels.label}>
            {(items as { type: 'doc'; doc: SearchDoc }[]).map((it) => renderDoc(it.doc))}
            {recentItems.length > 0 && (
              <li role="presentation" className="flex items-center justify-between px-3 pt-2 pb-1">
                <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{labels.recent}</span>
                <button
                  type="button"
                  className="text-xs text-brand-600 hover:underline"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearRecentSearches();
                    setRecent([]);
                  }}
                >
                  {labels.clear}
                </button>
              </li>
            )}
            {recentItems.map((r) => {
              idx++;
              const i = idx;
              return (
                <li
                  key={`r-${r.text}`}
                  id={optionId(i)}
                  role="option"
                  aria-selected={active === i}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${active === i ? 'bg-brand-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(i);
                  }}
                >
                  <Clock className="size-4 text-slate-400" aria-hidden="true" />
                  {r.text}
                </li>
              );
            })}
            {suggestedItems.length > 0 && (
              <li role="presentation" className="flex items-center gap-1 px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <Star className="size-3" aria-hidden="true" /> {labels.suggested}
              </li>
            )}
            {suggestedItems.map((it) => renderDoc(it.doc))}
          </ul>
          <p className="hidden border-t border-slate-100 px-3 pt-2 text-[11px] text-slate-400 sm:block dark:border-slate-800">{labels.hint}</p>
        </div>
      )}
    </div>
  );
}
