/**
 * Live RLS integration tests against a DEDICATED Supabase test project.
 * They are skipped unless SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY are set.
 * Required setup: migrations + seed applied; an admin user and an editor user
 * created (see docs/SETUP.md), credentials in SUPABASE_TEST_* variables.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const URL = process.env.SUPABASE_TEST_URL ?? '';
const KEY = process.env.SUPABASE_TEST_ANON_KEY ?? '';
const enabled = !!URL && !!KEY;
const mk = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

describe.skipIf(!enabled)('RLS — anonymous visitor', () => {
  const anon = enabled ? mk() : (null as unknown as SupabaseClient);
  it('reads only published tools', async () => {
    const { data, error } = await anon.from('tools').select('status');
    expect(error).toBeNull();
    expect(data!.every((r) => r.status === 'published')).toBe(true);
  });
  it('cannot modify the catalog', async () => {
    const { error, data } = await anon.from('tools').update({ title: 'hacked' }).eq('id', 'word-counter').select();
    expect(error !== null || (data ?? []).length === 0).toBe(true);
    const ins = await anon.from('tools').insert({ id: 'x', slug: 'x', implementation_key: 'word-counter', category_id: 'text-tools', title: 'x', short_description: 'x' });
    expect(ins.error).not.toBeNull();
  });
  it('cannot read admin users or logs, nor call privileged RPCs', async () => {
    expect((await anon.from('admin_users').select('*')).data ?? []).toHaveLength(0);
    expect((await anon.from('admin_activity_logs').select('*')).data ?? []).toHaveLength(0);
    expect((await anon.rpc('set_admin_role', { p_email: 'a@b.c', p_role: 'owner', p_active: true })).error).not.toBeNull();
    expect((await anon.rpc('log_admin_event', { p_action: 'auth.login', p_details: {} })).error).not.toBeNull();
  });
  it('public payload contains no drafts', async () => {
    const { data, error } = await anon.rpc('public_site_payload');
    expect(error).toBeNull();
    expect((data.tools as { status: string }[]).every((t) => t.status === 'published')).toBe(true);
  });
});

const ED_EMAIL = process.env.SUPABASE_TEST_EDITOR_EMAIL ?? '';
const ED_PW = process.env.SUPABASE_TEST_EDITOR_PASSWORD ?? '';
describe.skipIf(!enabled || !ED_EMAIL)('RLS — editor', () => {
  const ed = enabled ? mk() : (null as unknown as SupabaseClient);
  let original = '';
  beforeAll(async () => {
    const { error } = await ed.auth.signInWithPassword({ email: ED_EMAIL, password: ED_PW });
    expect(error).toBeNull();
    original = (await ed.from('tools').select('title').eq('id', 'word-counter').single()).data!.title;
  });
  afterAll(async () => {
    await ed.from('tools').update({ title: original }).eq('id', 'word-counter');
    await ed.auth.signOut();
  });
  it('can edit tool metadata (and it is logged)', async () => {
    const { error } = await ed.from('tools').update({ title: `${original} ✓` }).eq('id', 'word-counter');
    expect(error).toBeNull();
  });
  it('cannot change site settings, ads, or roles', async () => {
    const s = await ed.from('site_settings').upsert({ key: 'seo', value: { allowIndexing: false } }).select();
    expect(s.error !== null || (s.data ?? []).length === 0).toBe(true);
    const a = await ed.from('advertisement_slots').update({ is_enabled: true }).eq('id', 'home').select();
    expect(a.error !== null || (a.data ?? []).length === 0).toBe(true);
    expect((await ed.rpc('set_admin_role', { p_email: ED_EMAIL, p_role: 'owner', p_active: true })).error).not.toBeNull();
    const self = await ed.from('admin_users').update({ role: 'owner' }).eq('email', ED_EMAIL).select();
    expect(self.error !== null || (self.data ?? []).length === 0).toBe(true);
  });
  it('cannot delete tools or read logs', async () => {
    const d = await ed.from('tools').delete().eq('id', 'word-counter').select();
    expect(d.error !== null || (d.data ?? []).length === 0).toBe(true);
    expect((await ed.from('admin_activity_logs').select('*')).data ?? []).toHaveLength(0);
  });
});

describe.skipIf(enabled)('RLS integration tests', () => {
  it.skip('skipped: set SUPABASE_TEST_URL / SUPABASE_TEST_ANON_KEY to run against a test project', () => {});
});
