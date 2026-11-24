import { useCallback, useEffect, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { IMPLEMENTATION_KEYS } from '../../types/tool';
import { TOOLS } from '../../registry/tools';
import { downloadText } from '../../lib/file-processing/download';
import { SUPABASE_URL } from '../../lib/supabase/config';
import { can, errMsg, type AdminRole } from '../../lib/supabase/browser';
import { useAdmin } from './AdminApp';
import { statusBadges, type ToolRow } from './ToolsManager';
import { Alert, Badge, Empty, fmtDate, Modal, PageHeader, Panel, SelectField, Spinner, TextField, useConfirm, useToast } from './ui';
import { TOOL_IMPORT_FIELDS, validateImportedTool } from './validation';

/* ------------------------------ Overview ---------------------------- */
interface Log {
  id: number;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
export function Overview() {
  const { sb, role } = useAdmin();
  const [tools, setTools] = useState<ToolRow[] | null>(null);
  const [catCount, setCatCount] = useState<number | null>(null);
  const [pages, setPages] = useState<{ id: string; title: string; updated_at: string; status: string }[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [db, setDb] = useState<{ ok: boolean; ms: number; error?: string } | null>(null);
  useEffect(() => {
    (async () => {
      const t0 = performance.now();
      const t = await sb.from('tools').select('*').order('updated_at', { ascending: false });
      setDb({ ok: !t.error, ms: Math.round(performance.now() - t0), error: t.error ? errMsg(t.error) : undefined });
      setTools((t.data as ToolRow[]) ?? []);
      const c = await sb.from('categories').select('id', { count: 'exact', head: true });
      setCatCount(c.count ?? 0);
      const p = await sb.from('pages').select('id,title,updated_at,status').order('updated_at', { ascending: false }).limit(5);
      setPages(p.data ?? []);
      if (can(role, 'admin')) {
        const l = await sb.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(8);
        setLogs((l.data as Log[]) ?? []);
      }
    })();
  }, [sb, role]);
  if (!tools) return <Spinner />;
  const live = tools.filter((t) => t.status !== 'archived');
  const stat = (label: string, value: number | string, tone = '') => (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
  return (
    <>
      <PageHeader title="Overview" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stat('Total tools', live.length)}
        {stat('Published', live.filter((t) => t.status === 'published').length, 'text-emerald-600')}
        {stat('Drafts', live.filter((t) => t.status === 'draft').length)}
        {stat('Disabled', live.filter((t) => !t.is_enabled).length, 'text-red-600')}
        {stat('Maintenance', live.filter((t) => t.is_maintenance).length, 'text-amber-600')}
        {stat('Categories', catCount ?? '—')}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="System health">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">Database connectivity {db?.ok ? <Badge tone="green">OK · {db.ms} ms</Badge> : <Badge tone="red">Error</Badge>}</li>
            {db?.error && <li><Alert tone="error">{db.error}</Alert></li>}
            <li className="flex justify-between">Implemented tools in code <Badge>{IMPLEMENTATION_KEYS.length}</Badge></li>
            <li className="flex justify-between">Catalog entries without code {tools.filter((t) => !(IMPLEMENTATION_KEYS as readonly string[]).includes(t.implementation_key)).length === 0 ? <Badge tone="green">None</Badge> : <Badge tone="red">Check</Badge>}</li>
          </ul>
          <div className="mt-4"><Alert tone="info">Visitor analytics are not connected, so no traffic or revenue figures are shown. Add a privacy-friendly analytics service (with consent where required) if you need them.</Alert></div>
        </Panel>
        <Panel title="Recently updated tools">
          <ul className="space-y-1.5 text-sm">
            {tools.slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <a href="#tools" className="truncate hover:underline">{t.title}</a>
                <span className="flex items-center gap-2">{statusBadges(t)}<span className="text-xs text-slate-500">{fmtDate(t.updated_at)}</span></span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent content">
          {pages.length === 0 ? <Empty>No custom pages yet.</Empty> : (
            <ul className="space-y-1.5 text-sm">{pages.map((p) => <li key={p.id} className="flex justify-between"><span>{p.title}</span><span className="text-xs text-slate-500">{p.status} · {fmtDate(p.updated_at)}</span></li>)}</ul>
          )}
        </Panel>
        {can(role, 'admin') && (
          <Panel title="Recent administrative activity">
            {logs.length === 0 ? <Empty>No activity recorded yet.</Empty> : (
              <ul className="space-y-1.5 text-sm">{logs.map((l) => <li key={l.id} className="flex justify-between gap-2"><span className="truncate"><code className="text-xs">{l.action}</code> {l.entity_id}</span><span className="shrink-0 text-xs text-slate-500">{l.actor_email ?? 'system'} · {fmtDate(l.created_at)}</span></li>)}</ul>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}

/* ---------------------------- Admin users --------------------------- */
interface AdminRow {
  user_id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}
export function AdminUsers() {
  const { sb, role, user } = useAdmin();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('editor');
  const load = useCallback(async () => {
    const { data, error } = await sb.from('admin_users').select('*').order('created_at');
    if (error) toast('error', errMsg(error));
    setRows((data as AdminRow[]) ?? []);
  }, [sb, toast]);
  useEffect(() => {
    load();
  }, [load]);
  const setRoleFor = async (em: string, r: AdminRole, active: boolean) => {
    const { error } = await sb.rpc('set_admin_role', { p_email: em, p_role: r, p_active: active });
    if (error) return toast('error', errMsg(error));
    toast('success', 'Administrator updated.');
    load();
  };
  return (
    <>
      {dialog}
      <PageHeader title="Admin users & roles" description="Owner: full access. Admin: tools, categories, content, SEO and settings. Editor: content and tool metadata only. Permissions are enforced by database policies." />
      <div className="space-y-6">
        {role === 'owner' && (
          <Panel title="Add or update an administrator" description="The person must first be invited in Supabase Dashboard → Authentication → Users. You cannot change your own role.">
            <div className="grid items-end gap-3 sm:grid-cols-[2fr_1fr_auto]">
              <TextField label="Email" type="email" value={email} onChange={setEmail} />
              <SelectField label="Role" value={newRole} onChange={setNewRole} options={[{ value: 'editor', label: 'Editor' }, { value: 'admin', label: 'Admin' }, { value: 'owner', label: 'Owner' }]} />
              <button type="button" className="btn-primary mb-0.5" disabled={!email.includes('@')} onClick={async () => { if (newRole === 'owner' && !(await confirm('Grant owner role?', 'Owners have full control, including managing other administrators.', { danger: true, confirmLabel: 'Grant owner' }))) return; await setRoleFor(email.trim(), newRole, true); setEmail(''); }}>Save</button>
            </div>
          </Panel>
        )}
        <Panel title="Administrators">
          {!rows ? <Spinner /> : (
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500"><tr className="border-b border-slate-200 dark:border-slate-800"><th className="py-2 text-start font-medium">Email</th><th className="py-2 text-start font-medium">Role</th><th className="py-2 text-start font-medium">Status</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const self = r.user_id === user.id;
                  return (
                    <tr key={r.user_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2">{r.email} {self && <Badge tone="blue">You</Badge>}</td>
                      <td className="py-2">
                        {role === 'owner' && !self ? (
                          <select className="input w-auto py-1" aria-label={`Role for ${r.email}`} value={r.role} onChange={(e) => setRoleFor(r.email, e.target.value as AdminRole, r.is_active)}>
                            <option value="editor">Editor</option><option value="admin">Admin</option><option value="owner">Owner</option>
                          </select>
                        ) : <span className="capitalize">{r.role}</span>}
                      </td>
                      <td className="py-2">{r.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}</td>
                      <td className="py-2 text-end">
                        {role === 'owner' && !self && (
                          <>
                            <button type="button" className="btn-ghost btn-sm" onClick={() => setRoleFor(r.email, r.role, !r.is_active)}>{r.is_active ? 'Suspend' : 'Reactivate'}</button>
                            <button type="button" className="btn-ghost btn-sm text-red-600" aria-label={`Remove ${r.email}`} onClick={async () => { if (await confirm('Remove administrator?', <>Remove admin access for <strong>{r.email}</strong>? Their Supabase Auth account is not deleted.</>, { danger: true, confirmLabel: 'Remove' })) { const { error } = await sb.rpc('remove_admin', { p_user_id: r.user_id }); if (error) toast('error', errMsg(error)); load(); } }}><Trash2 className="size-4" aria-hidden="true" /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
        <MfaPanel />
      </div>
    </>
  );
}

function MfaPanel() {
  const { sb } = useAdmin();
  const toast = useToast();
  const [factors, setFactors] = useState<{ id: string; status: string; friendly_name?: string }[]>([]);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const load = useCallback(async () => {
    const { data } = await sb.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);
  const start = async () => {
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `ToolNest ${new Date().toISOString().slice(0, 10)}` });
    if (error) return toast('error', errMsg(error));
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };
  const verify = async () => {
    if (!enroll) return;
    const ch = await sb.auth.mfa.challenge({ factorId: enroll.id });
    if (ch.error) return toast('error', errMsg(ch.error));
    const v = await sb.auth.mfa.verify({ factorId: enroll.id, challengeId: ch.data.id, code });
    if (v.error) return toast('error', 'Invalid code, try again.');
    toast('success', 'Two-factor authentication enabled.');
    setEnroll(null);
    setCode('');
    load();
  };
  const verified = factors.filter((f) => f.status === 'verified');
  return (
    <Panel title="Your account security (optional 2FA)" description="Time-based one-time passwords via Supabase Auth MFA. Enable “MFA” in your Supabase project if it is not available.">
      {verified.length > 0 ? (
        <div className="space-y-2 text-sm">
          <p><Badge tone="green">2FA enabled</Badge></p>
          {verified.map((f) => (
            <button key={f.id} type="button" className="btn-secondary btn-sm" onClick={async () => { const { error } = await sb.auth.mfa.unenroll({ factorId: f.id }); if (error) toast('error', errMsg(error)); load(); }}>Remove authenticator {f.friendly_name}</button>
          ))}
        </div>
      ) : enroll ? (
        <div className="space-y-3">
          <p className="text-sm">Scan this QR code with an authenticator app, then enter the 6-digit code.</p>
          <img src={enroll.qr} alt="Two-factor setup QR code" className="size-44 rounded bg-white p-2" />
          <p className="font-mono text-xs break-all">Secret: {enroll.secret}</p>
          <TextField label="Code" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} mono />
          <button type="button" className="btn-primary" disabled={code.length !== 6} onClick={verify}>Verify and enable</button>
        </div>
      ) : (
        <button type="button" className="btn-secondary" onClick={start}>Set up two-factor authentication</button>
      )}
    </Panel>
  );
}

/* ---------------------------- Activity logs ------------------------- */
const PAGE = 50;
export function ActivityLogs() {
  const { sb } = useAdmin();
  const toast = useToast();
  const [rows, setRows] = useState<Log[] | null>(null);
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const load = useCallback(async () => {
    let q = sb.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
    if (action) q = q.ilike('action', `${action.replace(/[%_]/g, '')}%`);
    const { data, error } = await q;
    if (error) toast('error', errMsg(error));
    setRows((data as Log[]) ?? []);
  }, [sb, page, action, toast]);
  useEffect(() => {
    load();
  }, [load]);
  const exportAll = async (fmt: 'json' | 'csv') => {
    const { data, error } = await sb.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(10000);
    if (error) return toast('error', errMsg(error));
    await sb.rpc('log_admin_event', { p_action: 'logs.download', p_details: { format: fmt, rows: data.length } });
    if (fmt === 'json') return downloadText(JSON.stringify(data, null, 2), 'activity-logs.json', 'application/json');
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['created_at,actor_email,action,entity_type,entity_id,details', ...data.map((l: Log) => [l.created_at, l.actor_email, l.action, l.entity_type, l.entity_id, JSON.stringify(l.details)].map(esc).join(','))].join('\r\n');
    downloadText(csv, 'activity-logs.csv', 'text/csv');
  };
  return (
    <>
      <PageHeader title="Activity logs" description="Recorded automatically by database triggers. Passwords, tokens and page contents are never logged; entries cannot be edited or deleted from the dashboard." actions={<><button type="button" className="btn-secondary btn-sm" onClick={() => exportAll('csv')}><Download className="size-4" aria-hidden="true" /> CSV</button><button type="button" className="btn-secondary btn-sm" onClick={() => exportAll('json')}><Download className="size-4" aria-hidden="true" /> JSON</button></>} />
      <Panel>
        <div className="mb-3 max-w-xs"><TextField label="Filter by action prefix" value={action} onChange={(v) => (setAction(v), setPage(0))} placeholder="tools., auth., settings." /></div>
        {!rows ? <Spinner /> : rows.length === 0 ? <Empty>No entries.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500"><tr className="border-b border-slate-200 dark:border-slate-800"><th className="py-2 text-start font-medium">When</th><th className="py-2 text-start font-medium">Admin</th><th className="py-2 text-start font-medium">Action</th><th className="py-2 text-start font-medium">Object</th><th className="py-2 text-start font-medium">Details</th></tr></thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 align-top dark:border-slate-800">
                    <td className="py-1.5 text-xs whitespace-nowrap">{fmtDate(l.created_at)}</td>
                    <td className="py-1.5">{l.actor_email ?? <em className="text-slate-400">system / SQL</em>}</td>
                    <td className="py-1.5"><code className="text-xs">{l.action}</code></td>
                    <td className="py-1.5 text-xs">{l.entity_type} {l.entity_id}</td>
                    <td className="max-w-xs py-1.5 font-mono text-[11px] break-all text-slate-500">{JSON.stringify(l.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <button type="button" className="btn-secondary btn-sm" disabled={(rows?.length ?? 0) < PAGE} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </Panel>
    </>
  );
}

/* --------------------------- Export & backup ------------------------ */
type Diff = { id: string; kind: 'new' | 'update' | 'same'; changed: string[] };
export function ExportBackup() {
  const { sb } = useAdmin();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [preview, setPreview] = useState<{ records: Record<string, unknown>[]; diffs: Diff[]; errors: string[] } | null>(null);
  const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const exportTable = async (table: string, file: string) => {
    const { data, error } = await sb.from(table).select('*');
    if (error) return toast('error', errMsg(error));
    await sb.rpc('log_admin_event', { p_action: 'export.download', p_details: { table, rows: data.length } });
    downloadText(JSON.stringify({ exported_at: new Date().toISOString(), table, rows: data }, null, 2), `${file}-${stamp()}.json`, 'application/json');
  };
  const onImport = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) return toast('error', 'Import file too large (max 2 MB).');
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      return toast('error', 'The file is not valid JSON.');
    }
    const list = Array.isArray(json) ? json : (json as { rows?: unknown[] })?.rows;
    if (!Array.isArray(list)) return toast('error', 'Expected an array of tools or a ToolNest export file ({ rows: [...] }).');
    if (list.length > 500) return toast('error', 'Too many records (max 500).');
    const [{ data: existing }, { data: cats }] = await Promise.all([sb.from('tools').select('*'), sb.from('categories').select('id')]);
    const catIds = (cats ?? []).map((c) => c.id);
    const errors: string[] = [];
    const records: Record<string, unknown>[] = [];
    list.forEach((r, i) => {
      const err = validateImportedTool(r, IMPLEMENTATION_KEYS, catIds);
      if (err) return errors.push(`Record ${i + 1}: ${err}`);
      const clean: Record<string, unknown> = {};
      for (const k of TOOL_IMPORT_FIELDS) if ((r as Record<string, unknown>)[k] !== undefined) clean[k] = (r as Record<string, unknown>)[k];
      records.push(clean);
    });
    const slugs = new Map<string, string>();
    for (const r of records) {
      const s = String(r.slug);
      if (slugs.has(s) && slugs.get(s) !== r.id) errors.push(`Duplicate slug “${s}” in file.`);
      slugs.set(s, String(r.id));
    }
    const diffs: Diff[] = records.map((r) => {
      const cur = (existing ?? []).find((e) => e.id === r.id);
      if (!cur) return { id: String(r.id), kind: 'new', changed: [] };
      const changed = Object.keys(r).filter((k) => JSON.stringify(cur[k]) !== JSON.stringify(r[k]));
      return { id: String(r.id), kind: changed.length ? 'update' : 'same', changed };
    });
    setPreview({ records, diffs, errors });
  };
  const apply = async () => {
    if (!preview || preview.errors.length) return;
    const updates = preview.diffs.filter((d) => d.kind === 'update').length;
    if (updates && !(await confirm('Overwrite existing tools?', `${updates} existing tool(s) will be overwritten with the imported values. This cannot be undone automatically — export a backup first.`, { danger: true, confirmLabel: 'Import' }))) return;
    const toWrite = preview.records.filter((r) => preview.diffs.find((d) => d.id === r.id)?.kind !== 'same');
    const { error } = await sb.from('tools').upsert(toWrite);
    if (error) return toast('error', errMsg(error));
    await sb.rpc('log_admin_event', { p_action: 'import.apply', p_details: { records: toWrite.length } });
    toast('success', `${toWrite.length} tool(s) imported.`);
    setPreview(null);
  };
  return (
    <>
      {dialog}
      <PageHeader title="Data export & backup" />
      <div className="space-y-6">
        <Panel title="Export (JSON)" description="Metadata exports for review or migration. A JSON export is NOT a complete database backup.">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => exportTable('tools', 'tools')}><Download className="size-4" aria-hidden="true" /> Tool catalog</button>
            <button type="button" className="btn-secondary" onClick={() => exportTable('categories', 'categories')}><Download className="size-4" aria-hidden="true" /> Categories</button>
            <button type="button" className="btn-secondary" onClick={() => exportTable('pages', 'pages')}><Download className="size-4" aria-hidden="true" /> Pages</button>
            <button type="button" className="btn-secondary" onClick={() => exportTable('translations', 'translations')}><Download className="size-4" aria-hidden="true" /> Translations</button>
            <button type="button" className="btn-secondary" onClick={() => exportTable('site_settings', 'settings')}><Download className="size-4" aria-hidden="true" /> Settings</button>
          </div>
        </Panel>
        <Panel title="Import tool metadata" description="Validated against implementation keys, categories and field limits. You will see a preview before anything is written.">
          <label className="btn-secondary cursor-pointer">
            <Upload className="size-4" aria-hidden="true" /> Choose JSON file
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
          </label>
        </Panel>
        <Panel title="Full database backups">
          <ul className="list-disc space-y-1 ps-5 text-sm">
            <li>Supabase Free does not include downloadable automated backups. Use the Supabase CLI: <code>supabase db dump --linked -f backup.sql</code> (schema) and <code>supabase db dump --linked --data-only -f data.sql</code>.</li>
            <li>Keep dumps outside the repository and encrypt them; they contain administrator emails.</li>
            <li>Restore with <code>psql &lt;connection-string&gt; -f backup.sql</code>. See docs/DEPLOYMENT.md.</li>
          </ul>
        </Panel>
      </div>
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Import preview" wide footer={<><button type="button" className="btn-secondary" onClick={() => setPreview(null)}>Cancel</button><button type="button" className="btn-primary" disabled={!!preview?.errors.length} onClick={apply}>Apply import</button></>}>
        {preview && (
          <>
            {preview.errors.length > 0 && <Alert tone="error"><strong>The file cannot be imported:</strong><ul className="mt-1 list-disc ps-5">{preview.errors.slice(0, 20).map((e) => <li key={e}>{e}</li>)}</ul></Alert>}
            <p className="text-sm">{preview.diffs.filter((d) => d.kind === 'new').length} new · {preview.diffs.filter((d) => d.kind === 'update').length} updated · {preview.diffs.filter((d) => d.kind === 'same').length} unchanged</p>
            <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
              {preview.diffs.map((d) => <li key={d.id}><Badge tone={d.kind === 'new' ? 'green' : d.kind === 'update' ? 'amber' : 'slate'}>{d.kind}</Badge> <code>{d.id}</code> {d.changed.length > 0 && <span className="text-xs text-slate-500">({d.changed.join(', ')})</span>}</li>)}
            </ul>
          </>
        )}
      </Modal>
    </>
  );
}

/* ---------------------------- System status ------------------------- */
export function SystemStatus() {
  const { sb, role, user } = useAdmin();
  const [checks, setChecks] = useState<{ name: string; ok: boolean; detail: string }[] | null>(null);
  useEffect(() => {
    (async () => {
      const out: { name: string; ok: boolean; detail: string }[] = [];
      const t0 = performance.now();
      const r = await sb.rpc('public_site_payload');
      out.push({ name: 'Public content RPC (public_site_payload)', ok: !r.error, detail: r.error ? errMsg(r.error) : `${Math.round(performance.now() - t0)} ms` });
      const s = await sb.auth.getSession();
      const exp = s.data.session?.expires_at ? new Date(s.data.session.expires_at * 1000) : null;
      out.push({ name: 'Auth session', ok: !!s.data.session, detail: exp ? `expires ${exp.toLocaleTimeString()} (auto-refresh on)` : 'none' });
      const aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      out.push({ name: 'Assurance level', ok: true, detail: aal.data?.currentLevel ?? 'unknown' });
      let siteOk = false;
      try {
        siteOk = (await fetch('/robots.txt', { cache: 'no-store' })).ok;
      } catch {
        /* offline */
      }
      out.push({ name: 'Website responding', ok: siteOk, detail: siteOk ? '/robots.txt OK' : 'could not fetch /robots.txt' });
      const { data: cats } = await sb.from('categories').select('id');
      const { data: tools } = await sb.from('tools').select('implementation_key');
      const missing = TOOLS.filter((t) => !(tools ?? []).some((x) => x.implementation_key === t.implementation)).length;
      out.push({ name: 'Registry vs catalog', ok: true, detail: `${TOOLS.length} implemented · ${tools?.length ?? 0} catalog entries · ${missing} implementation(s) without an entry · ${cats?.length ?? 0} categories` });
      setChecks(out);
    })();
  }, [sb]);
  return (
    <>
      <PageHeader title="System status" />
      <div className="space-y-6">
        <Panel title="Checks">
          {!checks ? <Spinner /> : (
            <ul className="space-y-2 text-sm">{checks.map((c) => <li key={c.name} className="flex flex-wrap justify-between gap-2"><span>{c.name}</span><span className="flex items-center gap-2 text-slate-500">{c.detail} {c.ok ? <Badge tone="green">OK</Badge> : <Badge tone="red">Problem</Badge>}</span></li>)}</ul>
          )}
        </Panel>
        <Panel title="Environment">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Supabase project</dt><dd className="font-mono text-xs break-all">{SUPABASE_URL}</dd></div>
            <div><dt className="text-slate-500">Signed in as</dt><dd>{user.email} ({role})</dd></div>
            <div><dt className="text-slate-500">Keys in browser</dt><dd>Public anon key only (service_role is never used)</dd></div>
            <div><dt className="text-slate-500">Hosting</dt><dd>Cloudflare Workers (static assets + SSR)</dd></div>
          </dl>
        </Panel>
        <Alert tone="info">Free tiers have limits (requests, database size, inactivity pausing on Supabase Free after 7 days without activity). See docs/FREE_TIER_LIMITS.md. If Supabase is paused or unavailable, the public site keeps working from the built-in registry.</Alert>
      </div>
    </>
  );
}
