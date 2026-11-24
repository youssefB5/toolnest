import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, CopyPlus, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { IMPLEMENTATION_KEYS } from '../../types/tool';
import { getToolDefinition } from '../../registry/tools';
import { ICON_NAMES, Icon } from '../common/Icon';
import { can, errMsg } from '../../lib/supabase/browser';
import { useAdmin } from './AdminApp';
import { Alert, Badge, Empty, fmtDate, Modal, PageHeader, Panel, SelectField, Spinner, TextAreaField, TextField, Toggle, useConfirm, useToast } from './ui';
import { slugify, validateToolForm, type Errors } from './validation';
import { SeoPreview } from './SeoPreview';

export interface ToolRow {
  id: string;
  slug: string;
  implementation_key: string;
  category_id: string;
  icon: string;
  title: string;
  short_description: string;
  description: string | null;
  instructions: string[] | null;
  seo_title: string | null;
  meta_description: string | null;
  keywords: string[];
  status: 'draft' | 'published' | 'archived';
  is_enabled: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_maintenance: boolean;
  sort_order: number;
  updated_at: string;
  published_at: string | null;
}

type Form = Omit<ToolRow, 'description' | 'instructions' | 'seo_title' | 'meta_description' | 'keywords' | 'updated_at' | 'published_at'> & {
  description: string;
  instructions: string;
  seo_title: string;
  meta_description: string;
  keywords: string;
};

const toForm = (r: ToolRow): Form => ({
  ...r,
  description: r.description ?? '',
  instructions: (r.instructions ?? []).join('\n'),
  seo_title: r.seo_title ?? '',
  meta_description: r.meta_description ?? '',
  keywords: (r.keywords ?? []).join(', '),
});

const fromForm = (f: Form) => ({
  id: f.id,
  slug: f.slug,
  implementation_key: f.implementation_key,
  category_id: f.category_id,
  icon: f.icon,
  title: f.title.trim(),
  short_description: f.short_description.trim(),
  description: f.description.trim() || null,
  instructions: f.instructions.split('\n').map((l) => l.trim()).filter(Boolean).length ? f.instructions.split('\n').map((l) => l.trim()).filter(Boolean) : null,
  seo_title: f.seo_title.trim() || null,
  meta_description: f.meta_description.trim() || null,
  keywords: f.keywords.split(',').map((k) => k.trim()).filter(Boolean),
  status: f.status,
  is_enabled: f.is_enabled,
  is_featured: f.is_featured,
  is_popular: f.is_popular,
  is_maintenance: f.is_maintenance,
  sort_order: f.sort_order,
});

export function statusBadges(t: Pick<ToolRow, 'status' | 'is_enabled' | 'is_maintenance'>) {
  return (
    <span className="flex flex-wrap gap-1">
      {t.status === 'published' && <Badge tone="green">Published</Badge>}
      {t.status === 'draft' && <Badge tone="slate">Draft</Badge>}
      {t.status === 'archived' && <Badge tone="red">Archived</Badge>}
      {!t.is_enabled && <Badge tone="red">Disabled</Badge>}
      {t.is_maintenance && <Badge tone="amber">Maintenance</Badge>}
    </span>
  );
}

export default function ToolsManager() {
  const { sb, role } = useAdmin();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [rows, setRows] = useState<ToolRow[] | null>(null);
  const [cats, setCats] = useState<{ id: string; title: string }[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [status, setStatus] = useState<'all' | 'published' | 'draft' | 'disabled' | 'maintenance' | 'archived'>('all');
  const [sort, setSort] = useState<'order' | 'title' | 'updated'>('order');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<{ form: Form; isNew: boolean } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [bulkCat, setBulkCat] = useState('');

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([sb.from('tools').select('*').order('sort_order'), sb.from('categories').select('id,title').order('sort_order')]);
    if (t.error) toast('error', errMsg(t.error));
    setRows((t.data as ToolRow[]) ?? []);
    setCats(c.data ?? []);
  }, [sb, toast]);
  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => (status === 'archived' ? r.status === 'archived' : status === 'all' ? r.status !== 'archived' : true))
      .filter((r) => cat === 'all' || r.category_id === cat)
      .filter((r) =>
        status === 'published' ? r.status === 'published' : status === 'draft' ? r.status === 'draft' : status === 'disabled' ? !r.is_enabled : status === 'maintenance' ? r.is_maintenance : true,
      )
      .filter((r) => !term || `${r.title} ${r.slug} ${r.implementation_key} ${r.keywords.join(' ')}`.toLowerCase().includes(term))
      .sort((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : sort === 'updated' ? b.updated_at.localeCompare(a.updated_at) : a.sort_order - b.sort_order));
  }, [rows, q, cat, status, sort]);

  const patch = async (ids: string[], values: Partial<ToolRow>, label: string) => {
    if (!ids.length) return;
    const { error } = await sb.from('tools').update(values).in('id', ids);
    if (error) return toast('error', errMsg(error));
    toast('success', `${label}: ${ids.length} tool(s) updated.`);
    setSel(new Set());
    load();
  };

  const openNew = () => {
    const key = IMPLEMENTATION_KEYS[0];
    const def = getToolDefinition(key)!;
    setErrors({});
    setEdit({
      isNew: true,
      form: {
        id: `${def.id}-copy`,
        slug: `${def.slug}-copy`,
        implementation_key: key,
        category_id: def.category,
        icon: def.icon,
        title: def.title,
        short_description: def.short,
        description: '',
        instructions: '',
        seo_title: '',
        meta_description: '',
        keywords: def.keywords.join(', '),
        status: 'draft',
        is_enabled: true,
        is_featured: false,
        is_popular: false,
        is_maintenance: false,
        sort_order: 1000,
      },
    });
  };

  const duplicate = (r: ToolRow) => {
    setErrors({});
    const base = `${r.slug}-copy`.slice(0, 74);
    setEdit({ isNew: true, form: { ...toForm(r), id: `${r.id}-copy`.slice(0, 74), slug: base, title: `${r.title} (copy)`.slice(0, 100), status: 'draft', is_featured: false, is_popular: false } });
  };

  const save = async () => {
    if (!edit) return;
    const f = edit.form;
    const errs = validateToolForm({ ...f, sort_order: Number(f.sort_order) });
    if (rows?.some((r) => r.slug === f.slug && (edit.isNew || r.id !== f.id))) errs.slug = 'Another tool already uses this slug.';
    if (edit.isNew && rows?.some((r) => r.id === f.id)) errs.id = 'This ID already exists.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const payload = fromForm({ ...f, sort_order: Number(f.sort_order) });
    const res = edit.isNew ? await sb.from('tools').insert(payload) : await sb.from('tools').update(payload).eq('id', f.id);
    setSaving(false);
    if (res.error) return toast('error', errMsg(res.error));
    toast('success', edit.isNew ? 'Tool entry created.' : 'Tool saved.');
    setEdit(null);
    load();
  };

  const remove = async (r: ToolRow) => {
    if (!(await confirm('Delete tool entry permanently?', <>This permanently deletes the metadata for <strong>{r.title}</strong>. The processing code stays in the codebase. This cannot be undone.</>, { danger: true, confirmLabel: 'Delete permanently' }))) return;
    const { error } = await sb.from('tools').delete().eq('id', r.id);
    if (error) return toast('error', errMsg(error));
    toast('success', 'Tool entry deleted.');
    load();
  };

  const allSelected = filtered.length > 0 && filtered.every((r) => sel.has(r.id));
  const ids = [...sel];
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setEdit((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  return (
    <>
      {dialog}
      <PageHeader
        title="Tools management"
        description="Manage the availability and metadata of tools implemented in the codebase. Changing metadata never creates new processing functionality."
        actions={
          <button type="button" className="btn-primary" onClick={openNew}>
            <Plus className="size-4" aria-hidden="true" /> New tool entry
          </button>
        }
      />
      <Panel>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextField label="Search" value={q} onChange={setQ} placeholder="Title, slug, keyword…" />
          <SelectField label="Category" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All categories' }, ...cats.map((c) => ({ value: c.id, label: c.title }))]} />
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All (not archived)' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
              { value: 'disabled', label: 'Disabled' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
          <SelectField label="Sort by" value={sort} onChange={setSort} options={[{ value: 'order', label: 'Homepage order' }, { value: 'title', label: 'Title' }, { value: 'updated', label: 'Recently updated' }]} />
        </div>

        {sel.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 p-2 text-sm dark:bg-brand-700/20" role="region" aria-label="Bulk actions">
            <strong className="px-2">{sel.size} selected</strong>
            <button type="button" className="btn-secondary btn-sm" onClick={() => patch(ids, { status: 'published' }, 'Published')}>Publish</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => patch(ids, { status: 'draft' }, 'Unpublished')}>Unpublish</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => patch(ids, { is_enabled: true }, 'Enabled')}>Enable</button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={async () => (await confirm('Disable tools?', `${sel.size} tool(s) will become unavailable to visitors.`, { danger: true, confirmLabel: 'Disable' })) && patch(ids, { is_enabled: false }, 'Disabled')}
            >
              Disable
            </button>
            <select className="input w-auto py-1 text-xs" aria-label="Move to category" value={bulkCat} onChange={(e) => setBulkCat(e.target.value)}>
              <option value="">Change category…</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button type="button" className="btn-secondary btn-sm" disabled={!bulkCat} onClick={() => patch(ids, { category_id: bulkCat }, 'Category changed')}>Apply</button>
          </div>
        )}

        {!rows ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <Empty>No tools match these filters.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="w-8 py-2">
                    <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={(e) => setSel(e.target.checked ? new Set(filtered.map((r) => r.id)) : new Set())} />
                  </th>
                  <th className="py-2 text-start font-medium">Tool</th>
                  <th className="py-2 text-start font-medium">Category</th>
                  <th className="py-2 text-start font-medium">Status</th>
                  <th className="py-2 text-end font-medium">Order</th>
                  <th className="py-2 text-end font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 align-top dark:border-slate-800">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.title}`}
                        checked={sel.has(r.id)}
                        onChange={(e) =>
                          setSel((s) => {
                            const n = new Set(s);
                            if (e.target.checked) n.add(r.id);
                            else n.delete(r.id);
                            return n;
                          })
                        }
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex items-start gap-2">
                        <Icon name={r.icon} size={18} className="mt-0.5 text-brand-600" />
                        <div>
                          <div className="font-medium">
                            {r.title} {r.is_featured && <Badge tone="blue">Featured</Badge>} {r.is_popular && <Badge tone="blue">Popular</Badge>}
                          </div>
                          <div className="font-mono text-xs text-slate-500">/tools/{r.slug}/ · {r.implementation_key}</div>
                          <div className="text-xs text-slate-400">Updated {fmtDate(r.updated_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2">{cats.find((c) => c.id === r.category_id)?.title ?? r.category_id}</td>
                    <td className="py-2">{statusBadges(r)}</td>
                    <td className="py-2 text-end tabular-nums">{r.sort_order}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="btn-ghost btn-sm" onClick={() => (setErrors({}), setEdit({ isNew: false, form: toForm(r) }))} aria-label={`Edit ${r.title}`} title="Edit">
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <a className="btn-ghost btn-sm" href={`/tools/${r.slug}/`} target="_blank" rel="noopener" aria-label={`Preview ${r.title}`} title={r.status === 'published' ? 'Preview (public page)' : 'Not public until published'}>
                          <Eye className="size-4" aria-hidden="true" />
                        </a>
                        <button type="button" className="btn-ghost btn-sm" onClick={() => duplicate(r)} aria-label={`Duplicate ${r.title}`} title="Duplicate metadata">
                          <CopyPlus className="size-4" aria-hidden="true" />
                        </button>
                        {r.status !== 'archived' ? (
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            title="Archive"
                            aria-label={`Archive ${r.title}`}
                            onClick={async () => (await confirm('Archive this tool?', 'It will be removed from the public site. You can restore it later.', { confirmLabel: 'Archive' })) && patch([r.id], { status: 'archived' }, 'Archived')}
                          >
                            <Archive className="size-4" aria-hidden="true" />
                          </button>
                        ) : (
                          <>
                            <button type="button" className="btn-ghost btn-sm" title="Restore as draft" aria-label={`Restore ${r.title}`} onClick={() => patch([r.id], { status: 'draft' }, 'Restored')}>
                              <ArchiveRestore className="size-4" aria-hidden="true" />
                            </button>
                            {can(role, 'admin') && (
                              <button type="button" className="btn-ghost btn-sm text-red-600" title="Delete permanently" aria-label={`Delete ${r.title}`} onClick={() => remove(r)}>
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.isNew ? 'New tool entry' : `Edit: ${edit?.form.title ?? ''}`}
        wide
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        {edit && (
          <>
            {Object.keys(errors).length > 0 && <Alert tone="error">Please fix the highlighted fields: {Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' · ')}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Implementation (code)"
                value={edit.form.implementation_key}
                onChange={(k) => {
                  const def = getToolDefinition(k);
                  set('implementation_key')(k);
                  if (edit.isNew && def) setEdit((e) => (e ? { ...e, form: { ...e.form, implementation_key: k, category_id: def.category, icon: def.icon, title: def.title, short_description: def.short } } : e));
                }}
                options={IMPLEMENTATION_KEYS.map((k) => ({ value: k, label: `${k} — ${getToolDefinition(k)?.title ?? ''}` }))}
                hint="Only implementations that exist in the codebase can be selected."
              />
              <TextField label="ID" value={edit.form.id} onChange={(v) => set('id')(v.toLowerCase())} disabled={!edit.isNew} mono hint={errors.id ?? 'Permanent identifier.'} />
              <TextField label="Title" value={edit.form.title} onChange={(v) => { set('title')(v); if (edit.isNew) set('slug')(slugify(v)); }} maxLength={100} counter required />
              <TextField label="Slug (URL)" value={edit.form.slug} onChange={(v) => set('slug')(v.toLowerCase())} mono hint={errors.slug ?? `/tools/${edit.form.slug}/`} />
              <SelectField label="Category" value={edit.form.category_id} onChange={set('category_id')} options={cats.map((c) => ({ value: c.id, label: c.title }))} />
              <div>
                <SelectField label="Icon" value={edit.form.icon} onChange={set('icon')} options={ICON_NAMES.map((n) => ({ value: n, label: n }))} />
                <div className="mt-2 text-brand-600"><Icon name={edit.form.icon} size={24} /></div>
              </div>
            </div>
            <TextAreaField label="Short description" value={edit.form.short_description} onChange={set('short_description')} rows={2} maxLength={300} counter />
            <TextAreaField label="Description (leave empty to use the built-in text)" value={edit.form.description} onChange={set('description')} rows={4} maxLength={3000} counter />
            <TextAreaField label="Instructions — one step per line (empty = built-in steps)" value={edit.form.instructions} onChange={set('instructions')} rows={4} hint={errors.instructions} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="SEO title" value={edit.form.seo_title} onChange={set('seo_title')} maxLength={70} counter />
              <TextField label="Keywords / tags (comma separated)" value={edit.form.keywords} onChange={set('keywords')} hint={errors.keywords} />
            </div>
            <TextAreaField label="Meta description" value={edit.form.meta_description} onChange={set('meta_description')} rows={2} maxLength={170} counter />
            <SeoPreview title={edit.form.seo_title || `${edit.form.title} — Free Online`} description={edit.form.meta_description || edit.form.short_description} path={`/tools/${edit.form.slug}/`} />
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="Status" value={edit.form.status} onChange={set('status')} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
              <TextField label="Homepage order" type="number" value={String(edit.form.sort_order)} onChange={(v) => set('sort_order')(Number(v))} hint={errors.sort_order} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Enabled" checked={edit.form.is_enabled} onChange={set('is_enabled')} hint="Disabled tools are hidden and their page shows “unavailable”." />
              <Toggle label="Maintenance mode" checked={edit.form.is_maintenance} onChange={set('is_maintenance')} hint="Shows a maintenance notice instead of the tool." />
              <Toggle label="Featured on homepage" checked={edit.form.is_featured} onChange={set('is_featured')} />
              <Toggle label="Popular" checked={edit.form.is_popular} onChange={set('is_popular')} />
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
