/**
 * Live Row Level Security tests against a Supabase stack.
 * Local:  npx supabase start && node scripts/setup-local-supabase.mjs && npm test
 * Skipped unless SUPABASE_TEST_URL / SUPABASE_TEST_ANON_KEY are set (env or .env.test.local).
 * Every test restores the data it changes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

if (existsSync('.env.test.local')) {
  for (const line of readFileSync('.env.test.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const env = (k: string) => process.env[`SUPABASE_TEST_${k}`] ?? '';
const enabled = !!env('URL') && !!env('ANON_KEY');
const mk = () => createClient(env('URL'), env('ANON_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(who: 'OWNER' | 'ADMIN' | 'EDITOR' | 'USER') {
  const c = mk();
  const { error } = await c.auth.signInWithPassword({ email: env(`${who}_EMAIL`), password: env(`${who}_PASSWORD`) });
  if (error) throw new Error(`${who} sign-in failed: ${error.message}`);
  return c;
}
/** A write was blocked if it errored or affected no rows. */
const blocked = (r: { error: unknown; data: unknown[] | null }) => r.error !== null || (r.data ?? []).length === 0;

describe.skipIf(!enabled)('live RLS', () => {
  let anon: SupabaseClient, owner: SupabaseClient, admin: SupabaseClient, editor: SupabaseClient, user: SupabaseClient;
  let original: { title: string; status: string; is_enabled: boolean };

  beforeAll(async () => {
    anon = mk();
    [owner, admin, editor, user] = await Promise.all([signIn('OWNER'), signIn('ADMIN'), signIn('EDITOR'), signIn('USER')]);
    original = (await owner.from('tools').select('title,status,is_enabled').eq('id', 'word-counter').single()).data!;
  });
  afterAll(async () => {
    await owner.from('tools').update(original).eq('id', 'word-counter');
    await owner.from('tools').delete().eq('id', 'rls-test-tool');
    await owner.rpc('set_admin_role', { p_email: env('EDITOR_EMAIL'), p_role: 'editor', p_active: true });
  });

  describe('anonymous visitor', () => {
    it('sees the 60 seeded published tools and 8 categories', async () => {
      const t = await anon.from('tools').select('id,status');
      expect(t.error).toBeNull();
      expect(t.data).toHaveLength(60);
      expect(t.data!.every((r) => r.status === 'published')).toBe(true);
      expect((await anon.from('categories').select('id')).data).toHaveLength(8);
    });
    it('cannot see drafts', async () => {
      await owner.from('tools').update({ status: 'draft' }).eq('id', 'word-counter');
      expect((await anon.from('tools').select('id').eq('id', 'word-counter')).data).toHaveLength(0);
      const payload = (await anon.rpc('public_site_payload')).data as { tools: { id: string }[] };
      expect(payload.tools.some((x) => x.id === 'word-counter')).toBe(false);
      await owner.from('tools').update({ status: 'published' }).eq('id', 'word-counter');
    });
    it('cannot write anything', async () => {
      expect(blocked(await anon.from('tools').update({ title: 'hacked' }).eq('id', 'word-counter').select())).toBe(true);
      expect((await anon.from('tools').insert({ id: 'x', slug: 'x', implementation_key: 'word-counter', category_id: 'text-tools', title: 'x', short_description: 'x' })).error).not.toBeNull();
      expect(blocked(await anon.from('site_settings').upsert({ key: 'seo', value: {} }).select())).toBe(true);
    });
    it('cannot read admins or logs, nor call privileged functions', async () => {
      expect((await anon.from('admin_users').select('*')).data ?? []).toHaveLength(0);
      expect((await anon.from('admin_activity_logs').select('*')).data ?? []).toHaveLength(0);
      expect((await anon.rpc('set_admin_role', { p_email: 'a@b.c', p_role: 'owner', p_active: true })).error).not.toBeNull();
      expect((await anon.rpc('log_admin_event', { p_action: 'auth.login', p_details: {} })).error).not.toBeNull();
    });
  });

  describe('signed-in user without an admin role', () => {
    it('has the same rights as a visitor', async () => {
      expect((await user.rpc('current_admin_role')).data).toBeNull();
      expect(blocked(await user.from('tools').update({ title: 'hacked' }).eq('id', 'word-counter').select())).toBe(true);
      expect((await user.from('admin_users').select('*')).data ?? []).toHaveLength(0);
      expect((await user.rpc('log_admin_event', { p_action: 'auth.login', p_details: {} })).error).not.toBeNull();
    });
  });

  describe('editor', () => {
    it('reports its role', async () => {
      expect((await editor.rpc('current_admin_role')).data).toBe('editor');
    });
    it('edits tool metadata; the change is logged by the trigger', async () => {
      const r = await editor.from('tools').update({ title: `${original.title} ✓` }).eq('id', 'word-counter').select();
      expect(r.error).toBeNull();
      expect(r.data).toHaveLength(1);
      const logs = (await owner.from('admin_activity_logs').select('*').eq('entity_id', 'word-counter').order('id', { ascending: false }).limit(1)).data!;
      expect(logs[0].actor_email).toBe(env('EDITOR_EMAIL'));
      expect(logs[0].action).toBe('tools.update');
      expect(JSON.stringify(logs[0].details)).not.toMatch(/password|token/i);
    });
    it('publish/disable actions are logged with specific names', async () => {
      await editor.from('tools').update({ is_enabled: false }).eq('id', 'word-counter');
      const l = (await owner.from('admin_activity_logs').select('action').eq('entity_id', 'word-counter').order('id', { ascending: false }).limit(1)).data!;
      expect(l[0].action).toBe('tools.disable');
      await editor.from('tools').update({ is_enabled: true }).eq('id', 'word-counter');
    });
    it('cannot change settings, ads, or roles, delete tools, or read logs', async () => {
      expect(blocked(await editor.from('site_settings').upsert({ key: 'seo', value: { allowIndexing: false } }).select())).toBe(true);
      expect(blocked(await editor.from('advertisement_slots').update({ is_enabled: true }).eq('id', 'home').select())).toBe(true);
      expect((await editor.rpc('set_admin_role', { p_email: env('EDITOR_EMAIL'), p_role: 'owner', p_active: true })).error).not.toBeNull();
      expect(blocked(await editor.from('admin_users').update({ role: 'owner' }).eq('email', env('EDITOR_EMAIL')).select())).toBe(true);
      expect(blocked(await editor.from('tools').delete().eq('id', 'word-counter').select())).toBe(true);
      expect((await editor.from('admin_activity_logs').select('*')).data ?? []).toHaveLength(0);
    });
    it('cannot attach an unknown implementation key', async () => {
      const r = await editor.from('tools').insert({ id: 'rls-test-tool', slug: 'rls-test-tool', implementation_key: 'run-arbitrary-js', category_id: 'text-tools', title: 'x', short_description: 'x' });
      expect(r.error).not.toBeNull();
    });
  });

  describe('admin', () => {
    it('updates settings and reads logs', async () => {
      const before = (await admin.from('site_settings').select('value').eq('key', 'general').single()).data!.value;
      const r = await admin.from('site_settings').update({ value: { ...before, maintenanceBanner: 'rls test' } }).eq('key', 'general').select();
      expect(r.error).toBeNull();
      expect((await admin.from('admin_activity_logs').select('action').eq('action', 'settings.general').limit(1)).data).toHaveLength(1);
      await admin.from('site_settings').update({ value: before }).eq('key', 'general');
    });
    it('deletes only archived tool entries', async () => {
      expect((await admin.from('tools').insert({ id: 'rls-test-tool', slug: 'rls-test-tool', implementation_key: 'word-counter', category_id: 'text-tools', title: 'T', short_description: 'S' })).error).toBeNull();
      expect(blocked(await admin.from('tools').delete().eq('id', 'rls-test-tool').select())).toBe(true);
      await admin.from('tools').update({ status: 'archived' }).eq('id', 'rls-test-tool');
      const d = await admin.from('tools').delete().eq('id', 'rls-test-tool').select();
      expect(d.error).toBeNull();
      expect(d.data).toHaveLength(1);
    });
    it('cannot delete a category that still has tools', async () => {
      expect((await admin.from('categories').delete().eq('id', 'text-tools')).error).not.toBeNull();
    });
    it('cannot manage administrators', async () => {
      expect((await admin.rpc('set_admin_role', { p_email: env('EDITOR_EMAIL'), p_role: 'admin', p_active: true })).error).not.toBeNull();
    });
  });

  describe('owner', () => {
    it('changes other roles but never its own', async () => {
      expect((await owner.rpc('set_admin_role', { p_email: env('EDITOR_EMAIL'), p_role: 'admin', p_active: true })).error).toBeNull();
      expect((await editor.rpc('current_admin_role')).data).toBe('admin');
      expect((await owner.rpc('set_admin_role', { p_email: env('EDITOR_EMAIL'), p_role: 'editor', p_active: true })).error).toBeNull();
      expect((await owner.rpc('set_admin_role', { p_email: env('OWNER_EMAIL'), p_role: 'editor', p_active: true })).error).not.toBeNull();
    });
    it('suspended administrators lose access immediately', async () => {
      await owner.rpc('set_admin_role', { p_email: env('EDITOR_EMAIL'), p_role: 'editor', p_active: false });
      expect(blocked(await editor.from('tools').update({ title: 'x' }).eq('id', 'word-counter').select())).toBe(true);
      await owner.rpc('set_admin_role', { p_email: env('EDITOR_EMAIL'), p_role: 'editor', p_active: true });
    });
    it('rejects unknown emails and non-allow-listed log actions', async () => {
      expect((await owner.rpc('set_admin_role', { p_email: 'nobody@nowhere.test', p_role: 'editor', p_active: true })).error).not.toBeNull();
      expect((await owner.rpc('log_admin_event', { p_action: 'auth.login', p_details: { ok: true } })).error).toBeNull();
      expect((await owner.rpc('log_admin_event', { p_action: 'drop.everything', p_details: {} })).error).not.toBeNull();
    });
  });
});
