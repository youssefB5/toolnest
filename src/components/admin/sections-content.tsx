import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { ICON_NAMES, Icon } from '../common/Icon';
import { renderSafeMarkdown } from '../../lib/security/markdown';
import { can, errMsg } from '../../lib/supabase/browser';
import { getToolDefinition } from '../../registry/tools';
import { isImplementationKey } from '../../types/tool';
import { useAdmin } from './AdminApp';
import { SeoPreview } from './SeoPreview';
import { Alert, Badge, Empty, fmtDate, Modal, PageHeader, Panel, SelectField, Spinner, TextAreaField, TextField, Toggle, useConfirm, useToast } from './ui';
import { SLUG_RE, slugify } from './validation';

/** Fetch a table's rows with RLS. */
function useRows<T>(table: string, order: string) {
  const { sb } = useAdmin();
  const toast = useToast();
  const [rows, setRows] = useState<T[] | null>(null);
  const load = useCallback(async () => {
    const { data, error } = await sb.from(table).select('*').order(order);
    if (error) toast('error', errMsg(error));
    setRows((data as T[]) ?? []);
  }, [sb, table, order, toast]);
  useEffect(() => {
    load();
  }, [load]);
  return { rows, load };
}

function Markdown({ src }: { src: string }) {
  // renderSafeMarkdown escapes raw HTML and filters URLs (same renderer as the public site)
  return <div className="prose-content rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950" dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(src) }} />;
}

/* ----------------------------- Categories --------------------------- */
interface Cat {
  id: string;
  slug: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_visible: boolean;
  seo_title: string | null;
  meta_description: string | null;
}
export function Categories() {
  const { sb, role } = useAdmin();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { rows, load } = useRows<Cat>('categories', 'sort_order');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [edit, setEdit] = useState<{ c: Cat; isNew: boolean } | null>(null);
  useEffect(() => {
    sb.from('tools').select('category_id').then(({ data }) => {
      const m: Record<string, number> = {};
      for (const r of data ?? []) m[r.category_id] = (m[r.category_id] ?? 0) + 1;
      setCounts(m);
    });
  }, [sb, rows]);
  if (!rows) return <Spinner />;
  const save = async () => {
    if (!edit) return;
    const c = edit.c;
    if (!SLUG_RE.test(c.id) || !SLUG_RE.test(c.slug)) return toast('error', 'ID and slug: lowercase letters, digits and hyphens only.');
    if (!c.title.trim()) return toast('error', 'Title is required.');
    const payload = { ...c, seo_title: c.seo_title || null, meta_description: c.meta_description || null };
    const res = edit.isNew ? await sb.from('categories').insert(payload) : await sb.from('categories').update(payload).eq('id', c.id);
    if (res.error) return toast('error', errMsg(res.error));
    toast('success', 'Category saved.');
    setEdit(null);
    load();
  };
  const remove = async (c: Cat) => {
    const n = counts[c.id] ?? 0;
    if (n > 0) return toast('error', `“${c.title}” still contains ${n} tool(s). Move them to another category first.`);
    if (!(await confirm('Delete category?', <>Delete <strong>{c.title}</strong> permanently?</>, { danger: true, confirmLabel: 'Delete' }))) return;
    const { error } = await sb.from('categories').delete().eq('id', c.id);
    if (error) return toast('error', errMsg(error));
    toast('success', 'Category deleted.');
    load();
  };
  const move = async (i: number, d: -1 | 1) => {
    const a = rows[i];
    const b = rows[i + d];
    if (!a || !b) return;
    await sb.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id);
    await sb.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id);
    load();
  };
  const set = <K extends keyof Cat>(k: K) => (v: Cat[K]) => setEdit((e) => (e ? { ...e, c: { ...e.c, [k]: v } } : e));
  return (
    <>
      {dialog}
      <PageHeader
        title="Categories"
        actions={
          can(role, 'admin') && (
            <button type="button" className="btn-primary" onClick={() => setEdit({ isNew: true, c: { id: '', slug: '', icon: 'Folder', title: '', description: '', sort_order: (rows.at(-1)?.sort_order ?? 0) + 10, is_visible: true, seo_title: '', meta_description: '' } })}>
              <Plus className="size-4" aria-hidden="true" /> New category
            </button>
          )
        }
      />
      <Panel>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <Icon name={c.icon} size={20} className="text-brand-600" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {c.title} {!c.is_visible && <Badge tone="amber">Hidden</Badge>}
                </div>
                <div className="font-mono text-xs text-slate-500">/categories/{c.slug}/ · {counts[c.id] ?? 0} tools</div>
              </div>
              <button type="button" className="btn-ghost btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${c.title} up`}><ArrowUp className="size-4" aria-hidden="true" /></button>
              <button type="button" className="btn-ghost btn-sm" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${c.title} down`}><ArrowDown className="size-4" aria-hidden="true" /></button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setEdit({ isNew: false, c: { ...c, seo_title: c.seo_title ?? '', meta_description: c.meta_description ?? '' } })} aria-label={`Edit ${c.title}`}><Pencil className="size-4" aria-hidden="true" /></button>
              {can(role, 'admin') && <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => remove(c)} aria-label={`Delete ${c.title}`}><Trash2 className="size-4" aria-hidden="true" /></button>}
            </li>
          ))}
        </ul>
      </Panel>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.isNew ? 'New category' : 'Edit category'} footer={<><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn-primary" onClick={save}>Save</button></>}>
        {edit && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Title" value={edit.c.title} onChange={(v) => { set('title')(v); if (edit.isNew) { set('id')(slugify(v)); set('slug')(slugify(v)); } }} maxLength={80} required />
              <TextField label="ID" value={edit.c.id} onChange={set('id')} disabled={!edit.isNew} mono />
              <TextField label="Slug" value={edit.c.slug} onChange={(v) => set('slug')(v.toLowerCase())} mono />
              <SelectField label="Icon" value={edit.c.icon} onChange={set('icon')} options={ICON_NAMES.map((n) => ({ value: n, label: n }))} />
            </div>
            <TextAreaField label="Description" value={edit.c.description} onChange={set('description')} maxLength={500} counter rows={3} />
            <Toggle label="Visible on the public site" checked={edit.c.is_visible} onChange={set('is_visible')} />
            <TextField label="SEO title" value={edit.c.seo_title ?? ''} onChange={set('seo_title')} maxLength={70} counter />
            <TextAreaField label="Meta description" value={edit.c.meta_description ?? ''} onChange={set('meta_description')} maxLength={170} counter rows={2} />
            <SeoPreview title={edit.c.seo_title || edit.c.title} description={edit.c.meta_description || edit.c.description} path={`/categories/${edit.c.slug}/`} />
          </>
        )}
      </Modal>
    </>
  );
}

/* ------------------------------ Homepage ---------------------------- */
interface Section {
  id: string;
  is_enabled: boolean;
  sort_order: number;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  cta_text: string | null;
}
interface Faq {
  id: string;
  scope: 'home' | 'tool' | 'general';
  tool_id: string | null;
  locale: 'en' | 'fr' | 'ar';
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}
const SECTION_NAMES: Record<string, string> = { hero: 'Hero', popular: 'Popular tools', categories: 'Browse by category', recent: 'Recently added', why: 'Why use this website', faq: 'FAQ', seo: 'SEO introduction' };
export function Homepage() {
  const { sb } = useAdmin();
  const toast = useToast();
  const { rows, load } = useRows<Section>('homepage_sections', 'sort_order');
  const faqs = useRows<Faq>('faqs', 'sort_order');
  const [draft, setDraft] = useState<Section[] | null>(null);
  const [faqEdit, setFaqEdit] = useState<Faq | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  useEffect(() => {
    if (rows) setDraft(rows.length ? rows : Object.keys(SECTION_NAMES).map((id, i) => ({ id, is_enabled: true, sort_order: i + 1, title: null, subtitle: null, body: null, cta_text: null })));
  }, [rows]);
  if (!draft || !faqs.rows) return <Spinner />;
  const upd = (i: number, p: Partial<Section>) => setDraft(draft.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const move = (i: number, d: -1 | 1) => {
    const n = [...draft];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    setDraft(n.map((s, k) => ({ ...s, sort_order: k + 1 })));
  };
  const publish = async () => {
    const { error } = await sb.from('homepage_sections').upsert(draft.map((s) => ({ ...s, title: s.title || null, subtitle: s.subtitle || null, body: s.body || null, cta_text: s.cta_text || null })));
    if (error) return toast('error', errMsg(error));
    toast('success', 'Homepage published.');
    load();
  };
  const saveFaq = async () => {
    if (!faqEdit) return;
    if (faqEdit.question.trim().length < 3 || !faqEdit.answer.trim()) return toast('error', 'Question and answer are required.');
    const { id, ...rest } = faqEdit;
    const res = id ? await sb.from('faqs').update(rest).eq('id', id) : await sb.from('faqs').insert({ ...rest, scope: 'home', tool_id: null });
    if (res.error) return toast('error', errMsg(res.error));
    setFaqEdit(null);
    faqs.load();
  };
  const homeFaqs = faqs.rows.filter((f) => f.scope === 'home');
  return (
    <>
      {dialog}
      <PageHeader title="Homepage" description="Edit section texts, order and visibility. Empty fields use the built-in translated defaults. Changes go live when you click Publish." actions={<button type="button" className="btn-primary" onClick={publish}>Publish homepage</button>} />
      <div className="space-y-4">
        {draft.map((s, i) => (
          <Panel
            key={s.id}
            title={`${i + 1}. ${SECTION_NAMES[s.id] ?? s.id}`}
            actions={
              <>
                <Toggle label="Visible" checked={s.is_enabled} onChange={(v) => upd(i, { is_enabled: v })} />
                <button type="button" className="btn-ghost btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-4" aria-hidden="true" /></button>
                <button type="button" className="btn-ghost btn-sm" disabled={i === draft.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-4" aria-hidden="true" /></button>
              </>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Title (English)" value={s.title ?? ''} onChange={(v) => upd(i, { title: v })} maxLength={150} />
              <TextField label="Subtitle (English)" value={s.subtitle ?? ''} onChange={(v) => upd(i, { subtitle: v })} maxLength={400} />
              {s.id === 'hero' && <TextField label="Call-to-action button text (optional)" value={s.cta_text ?? ''} onChange={(v) => upd(i, { cta_text: v })} maxLength={60} />}
            </div>
            {s.id === 'seo' && (
              <div className="mt-3 space-y-2">
                <TextAreaField label="Introduction (Markdown)" value={s.body ?? ''} onChange={(v) => upd(i, { body: v })} rows={8} maxLength={20000} counter hint="Raw HTML is not allowed and will be shown as text." />
                <button type="button" className="btn-secondary btn-sm" onClick={() => setPreviewId(previewId === s.id ? null : s.id)}>{previewId === s.id ? 'Hide preview' : 'Preview'}</button>
                {previewId === s.id && <Markdown src={s.body || '_Empty — the built-in introduction will be used._'} />}
              </div>
            )}
            {s.id === 'popular' && <p className="mt-2 text-sm text-slate-500">Featured/popular tools are selected in Tools (toggle “Featured” or “Popular”), ordered by homepage order.</p>}
          </Panel>
        ))}
        <Panel title="Homepage FAQ" description="If no entry exists for a language, the built-in FAQ for that language is shown." actions={<button type="button" className="btn-secondary btn-sm" onClick={() => setFaqEdit({ id: '', scope: 'home', tool_id: null, locale: 'en', question: '', answer: '', sort_order: homeFaqs.length + 1, is_published: true })}><Plus className="size-4" aria-hidden="true" /> Add question</button>}>
          {homeFaqs.length === 0 ? (
            <Empty>No custom FAQ entries — built-in questions are displayed.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {homeFaqs.map((f) => (
                <li key={f.id} className="flex items-start gap-3 py-2">
                  <Badge>{f.locale.toUpperCase()}</Badge>
                  <div className="flex-1">
                    <p className="font-medium">{f.question} {!f.is_published && <Badge tone="amber">Draft</Badge>}</p>
                    <p className="line-clamp-2 text-sm text-slate-500">{f.answer}</p>
                  </div>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setFaqEdit(f)} aria-label="Edit question"><Pencil className="size-4" aria-hidden="true" /></button>
                  <button type="button" className="btn-ghost btn-sm text-red-600" aria-label="Delete question" onClick={async () => { if (await confirm('Delete question?', f.question, { danger: true, confirmLabel: 'Delete' })) { await sb.from('faqs').delete().eq('id', f.id); faqs.load(); } }}><Trash2 className="size-4" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Modal open={!!faqEdit} onClose={() => setFaqEdit(null)} title="FAQ entry" footer={<><button type="button" className="btn-secondary" onClick={() => setFaqEdit(null)}>Cancel</button><button type="button" className="btn-primary" onClick={saveFaq}>Save</button></>}>
        {faqEdit && (
          <>
            <SelectField label="Language" value={faqEdit.locale} onChange={(v) => setFaqEdit({ ...faqEdit, locale: v })} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} />
            <TextField label="Question" value={faqEdit.question} onChange={(v) => setFaqEdit({ ...faqEdit, question: v })} maxLength={300} />
            <TextAreaField label="Answer" value={faqEdit.answer} onChange={(v) => setFaqEdit({ ...faqEdit, answer: v })} maxLength={3000} counter rows={5} />
            <Toggle label="Published" checked={faqEdit.is_published} onChange={(v) => setFaqEdit({ ...faqEdit, is_published: v })} />
          </>
        )}
      </Modal>
    </>
  );
}

/* --------------------------- Pages & content ------------------------ */
interface PageRow {
  id: string;
  slug: string;
  locale: 'en' | 'fr' | 'ar';
  page_type: 'info' | 'legal' | 'help' | 'custom';
  title: string;
  body_markdown: string;
  status: 'draft' | 'published';
  seo_title: string | null;
  meta_description: string | null;
  updated_at: string;
}
const BUILTIN_SLUGS = ['about', 'contact', 'privacy-policy', 'terms', 'cookie-policy', 'disclaimer', 'help'];

function PagesManager({ legalOnly }: { legalOnly?: boolean }) {
  const { sb, role } = useAdmin();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { rows, load } = useRows<PageRow>('pages', 'slug');
  const [edit, setEdit] = useState<PageRow | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const list = useMemo(() => (rows ?? []).filter((p) => (legalOnly ? p.page_type === 'legal' : true)), [rows, legalOnly]);
  if (!rows) return <Spinner />;
  const blank = (): PageRow => ({ id: '', slug: '', locale: 'en', page_type: legalOnly ? 'legal' : 'custom', title: '', body_markdown: '', status: 'draft', seo_title: '', meta_description: '', updated_at: '' });
  const save = async () => {
    if (!edit) return;
    if (!SLUG_RE.test(edit.slug)) return toast('error', 'Slug: lowercase letters, digits and hyphens only.');
    if (!edit.title.trim()) return toast('error', 'Title is required.');
    if (edit.page_type === 'custom' && BUILTIN_SLUGS.includes(edit.slug)) return toast('error', 'This slug is reserved for a built-in page; choose the matching page type instead.');
    const { id, updated_at: _u, ...rest } = edit;
    const payload = { ...rest, seo_title: rest.seo_title || null, meta_description: rest.meta_description || null, published_at: rest.status === 'published' ? new Date().toISOString() : null };
    const res = id ? await sb.from('pages').update(payload).eq('id', id) : await sb.from('pages').insert(payload);
    if (res.error) return toast('error', errMsg(res.error));
    toast('success', 'Page saved.');
    setEdit(null);
    load();
  };
  const url = (p: PageRow) => `${p.locale === 'en' ? '' : `/${p.locale}`}${BUILTIN_SLUGS.includes(p.slug) ? `/${p.slug}/` : `/pages/${p.slug}/`}`;
  return (
    <>
      {dialog}
      <PageHeader
        title={legalOnly ? 'Legal pages' : 'Pages & content'}
        description={
          <>
            Built-in pages ({BUILTIN_SLUGS.join(', ')}) show a reviewed template until you publish your own version with the same slug. Content is Markdown; raw HTML and scripts are never executed.
            {legalOnly && ' Have legal texts reviewed for your jurisdiction.'}
          </>
        }
        actions={<button type="button" className="btn-primary" onClick={() => (setTab('edit'), setEdit(blank()))}><Plus className="size-4" aria-hidden="true" /> New page</button>}
      />
      <Panel>
        {list.length === 0 ? (
          <Empty>No pages in the database yet — built-in templates are used.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-2 text-start font-medium">Title</th>
                <th className="py-2 text-start font-medium">URL</th>
                <th className="py-2 text-start font-medium">Status</th>
                <th className="py-2 text-start font-medium">Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 font-medium">{p.title} <Badge>{p.locale.toUpperCase()}</Badge> <Badge tone="blue">{p.page_type}</Badge></td>
                  <td className="py-2 font-mono text-xs"><a className="text-brand-600 underline" href={url(p)} target="_blank" rel="noopener">{url(p)}</a></td>
                  <td className="py-2">{p.status === 'published' ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}</td>
                  <td className="py-2 text-xs">{fmtDate(p.updated_at)}</td>
                  <td className="py-2 text-end">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => (setTab('edit'), setEdit({ ...p, seo_title: p.seo_title ?? '', meta_description: p.meta_description ?? '' }))} aria-label={`Edit ${p.title}`}><Pencil className="size-4" aria-hidden="true" /></button>
                    {can(role, 'admin') && <button type="button" className="btn-ghost btn-sm text-red-600" aria-label={`Delete ${p.title}`} onClick={async () => { if (await confirm('Delete page?', <>Delete <strong>{p.title}</strong> ({p.locale})? Built-in pages fall back to their template.</>, { danger: true, confirmLabel: 'Delete' })) { const { error } = await sb.from('pages').delete().eq('id', p.id); if (error) toast('error', errMsg(error)); load(); } }}><Trash2 className="size-4" aria-hidden="true" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit page' : 'New page'} wide footer={<><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn-primary" onClick={save}>Save</button></>}>
        {edit && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2"><TextField label="Title" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v, slug: edit.id ? edit.slug : slugify(v) })} maxLength={150} required /></div>
              <TextField label="Slug" value={edit.slug} onChange={(v) => setEdit({ ...edit, slug: v.toLowerCase() })} mono />
              <SelectField label="Language" value={edit.locale} onChange={(v) => setEdit({ ...edit, locale: v })} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} />
              <SelectField label="Type" value={edit.page_type} onChange={(v) => setEdit({ ...edit, page_type: v })} options={[{ value: 'info', label: 'Information (about, contact)' }, { value: 'legal', label: 'Legal' }, { value: 'help', label: 'Help / FAQ' }, { value: 'custom', label: 'Custom (/pages/slug/)' }]} />
              <SelectField label="Status" value={edit.status} onChange={(v) => setEdit({ ...edit, status: v })} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />
            </div>
            <div role="tablist" className="flex gap-1">
              {(['edit', 'preview'] as const).map((t) => (
                <button key={t} role="tab" type="button" aria-selected={tab === t} className={`btn-sm rounded-md px-3 py-1.5 text-sm ${tab === t ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'btn-ghost'}`} onClick={() => setTab(t)}>{t === 'edit' ? 'Write' : 'Preview'}</button>
              ))}
            </div>
            {tab === 'edit' ? <TextAreaField label="Content (Markdown)" value={edit.body_markdown} onChange={(v) => setEdit({ ...edit, body_markdown: v })} rows={16} mono maxLength={100000} counter hint="Use {brand} for the site name and {contact} for the contact sentence." /> : <Markdown src={edit.body_markdown} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="SEO title" value={edit.seo_title ?? ''} onChange={(v) => setEdit({ ...edit, seo_title: v })} maxLength={70} counter />
              <TextField label="Meta description" value={edit.meta_description ?? ''} onChange={(v) => setEdit({ ...edit, meta_description: v })} maxLength={170} counter />
            </div>
            <SeoPreview title={edit.seo_title || edit.title} description={edit.meta_description || edit.body_markdown.slice(0, 160)} path={url(edit)} />
          </>
        )}
      </Modal>
    </>
  );
}
export const Pages = () => <PagesManager />;
export const LegalPages = () => <PagesManager legalOnly />;

/* ---------------------------- Announcements ------------------------- */
interface Ann {
  id: string;
  message: string;
  link_url: string | null;
  level: 'info' | 'warning' | 'success';
  locale: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}
const toLocalInput = (s: string | null) => (s ? new Date(s).toISOString().slice(0, 16) : '');
export function Announcements() {
  const { sb } = useAdmin();
  const toast = useToast();
  const { rows, load } = useRows<Ann>('announcements', 'created_at');
  const [edit, setEdit] = useState<Ann | null>(null);
  const { confirm, dialog } = useConfirm();
  if (!rows) return <Spinner />;
  const save = async () => {
    if (!edit) return;
    if (!edit.message.trim()) return toast('error', 'Message is required.');
    if (edit.link_url && !/^(https:\/\/|\/)[^\s<>"']*$/.test(edit.link_url)) return toast('error', 'Link must start with https:// or /.');
    const { id, ...rest } = edit;
    const payload = { ...rest, link_url: rest.link_url || null, locale: rest.locale || null, starts_at: rest.starts_at || null, ends_at: rest.ends_at || null };
    const res = id ? await sb.from('announcements').update(payload).eq('id', id) : await sb.from('announcements').insert(payload);
    if (res.error) return toast('error', errMsg(res.error));
    setEdit(null);
    load();
  };
  return (
    <>
      {dialog}
      <PageHeader title="Announcements" description="Short banners shown above the header (max 2 at a time)." actions={<button type="button" className="btn-primary" onClick={() => setEdit({ id: '', message: '', link_url: '', level: 'info', locale: '', is_active: false, starts_at: '', ends_at: '' })}><Plus className="size-4" aria-hidden="true" /> New announcement</button>} />
      <Panel>
        {rows.length === 0 ? <Empty>No announcements.</Empty> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <Badge tone={a.level === 'warning' ? 'amber' : a.level === 'success' ? 'green' : 'blue'}>{a.level}</Badge>
                <span className="flex-1">{a.message} {a.is_active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>} {a.locale && <Badge>{a.locale}</Badge>}</span>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setEdit(a)} aria-label="Edit"><Pencil className="size-4" aria-hidden="true" /></button>
                <button type="button" className="btn-ghost btn-sm text-red-600" aria-label="Delete" onClick={async () => { if (await confirm('Delete announcement?', a.message, { danger: true, confirmLabel: 'Delete' })) { await sb.from('announcements').delete().eq('id', a.id); load(); } }}><Trash2 className="size-4" aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Announcement" footer={<><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn-primary" onClick={save}>Save</button></>}>
        {edit && (
          <>
            <TextAreaField label="Message" value={edit.message} onChange={(v) => setEdit({ ...edit, message: v })} maxLength={300} counter rows={2} />
            <TextField label="Link (optional, https:// or /path)" value={edit.link_url ?? ''} onChange={(v) => setEdit({ ...edit, link_url: v })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Style" value={edit.level} onChange={(v) => setEdit({ ...edit, level: v })} options={[{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'success', label: 'Success' }]} />
              <SelectField label="Language" value={edit.locale ?? ''} onChange={(v) => setEdit({ ...edit, locale: v })} options={[{ value: '', label: 'All languages' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} />
              <TextField label="Starts (optional)" type="datetime-local" value={toLocalInput(edit.starts_at)} onChange={(v) => setEdit({ ...edit, starts_at: v ? new Date(v).toISOString() : '' })} />
              <TextField label="Ends (optional)" type="datetime-local" value={toLocalInput(edit.ends_at)} onChange={(v) => setEdit({ ...edit, ends_at: v ? new Date(v).toISOString() : '' })} />
            </div>
            <Toggle label="Active" checked={edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
          </>
        )}
      </Modal>
    </>
  );
}

/* ---------------------------- Translations -------------------------- */
interface Tr {
  id: string;
  locale: 'fr' | 'ar';
  entity_type: 'tool' | 'category' | 'homepage' | 'ui';
  entity_id: string;
  field: string;
  value: string;
  status: 'draft' | 'published';
}
const TOOL_FIELDS = ['title', 'short_description', 'description', 'instructions', 'seo_title', 'meta_description'];
export function Translations() {
  const { sb } = useAdmin();
  const toast = useToast();
  const { rows, load } = useRows<Tr>('translations', 'entity_id');
  const [tools, setTools] = useState<{ id: string; title: string; implementation_key: string }[]>([]);
  const [locale, setLocale] = useState<'fr' | 'ar'>('fr');
  const [toolId, setToolId] = useState('');
  const [draft, setDraft] = useState<Record<string, { value: string; status: 'draft' | 'published' }>>({});
  useEffect(() => {
    sb.from('tools').select('id,title,implementation_key').order('sort_order').then(({ data }) => {
      setTools(data ?? []);
      if (data?.[0]) setToolId((t) => t || data[0].id);
    });
  }, [sb]);
  useEffect(() => {
    if (!rows) return;
    const d: typeof draft = {};
    for (const f of TOOL_FIELDS) {
      const r = rows.find((x) => x.locale === locale && x.entity_type === 'tool' && x.entity_id === toolId && x.field === f);
      d[f] = { value: r?.value ?? '', status: r?.status ?? 'draft' };
    }
    setDraft(d);
  }, [rows, locale, toolId]);
  if (!rows) return <Spinner />;
  const completeness = tools.map((t) => {
    const have = (f: string) => rows.some((r) => r.locale === locale && r.entity_type === 'tool' && r.entity_id === t.id && r.field === f && r.status === 'published');
    return { ...t, complete: have('title') && have('short_description') && have('description') };
  });
  const done = completeness.filter((t) => t.complete).length;
  const save = async () => {
    for (const f of TOOL_FIELDS) {
      const d = draft[f];
      const existing = rows.find((x) => x.locale === locale && x.entity_type === 'tool' && x.entity_id === toolId && x.field === f);
      if (!d.value.trim()) {
        if (existing) await sb.from('translations').delete().eq('id', existing.id);
        continue;
      }
      const { error } = await sb.from('translations').upsert({ locale, entity_type: 'tool', entity_id: toolId, field: f, value: d.value.trim(), status: d.status }, { onConflict: 'locale,entity_type,entity_id,field' });
      if (error) return toast('error', errMsg(error));
    }
    toast('success', 'Translations saved.');
    load();
  };
  const tool = tools.find((t) => t.id === toolId);
  const def = tool && isImplementationKey(tool.implementation_key) ? getToolDefinition(tool.implementation_key) : undefined;
  return (
    <>
      <PageHeader title="Languages & translations" description="English is the primary language. A localized tool page is indexed only when its title, short description AND description are translated and published; otherwise visitors see the English guide with a notice, and the page is noindex." />
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Panel title={`Tool coverage (${locale.toUpperCase()})`} description={`${done}/${tools.length} tools fully localized`}>
          <SelectField label="Language" value={locale} onChange={setLocale} options={[{ value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية (RTL)' }]} />
          <ul className="mt-3 max-h-[28rem] space-y-0.5 overflow-y-auto text-sm">
            {completeness.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setToolId(t.id)} className={`flex w-full items-center justify-between rounded px-2 py-1 text-start ${t.id === toolId ? 'bg-brand-50 dark:bg-brand-700/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <span className="truncate">{t.title}</span>
                  {t.complete ? <Badge tone="green">✓</Badge> : <Badge>—</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={tool ? `${tool.title} → ${locale.toUpperCase()}` : 'Select a tool'}>
          {tool && (
            <div className="space-y-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              {TOOL_FIELDS.map((f) => (
                <div key={f} className="space-y-1">
                  {f === 'description' || f === 'instructions' ? (
                    <TextAreaField label={`${f}${f === 'instructions' ? ' (one step per line)' : ''}`} value={draft[f]?.value ?? ''} onChange={(v) => setDraft({ ...draft, [f]: { ...draft[f], value: v } })} rows={4} />
                  ) : (
                    <TextField label={f} value={draft[f]?.value ?? ''} onChange={(v) => setDraft({ ...draft, [f]: { ...draft[f], value: v } })} />
                  )}
                  <p className="text-xs text-slate-500" dir="ltr">
                    English: {f === 'title' ? tool.title : f === 'description' ? def?.content.description.slice(0, 140) + '…' : f === 'instructions' ? def?.content.steps.join(' / ').slice(0, 140) : '—'}
                  </p>
                  <div dir="ltr"><Toggle label="Published" checked={draft[f]?.status === 'published'} onChange={(v) => setDraft({ ...draft, [f]: { ...draft[f], status: v ? 'published' : 'draft' } })} /></div>
                </div>
              ))}
              <Alert tone="info">Do not publish machine-translated text without review. Empty fields fall back to English.</Alert>
              <button type="button" className="btn-primary" onClick={save}>Save translations</button>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
