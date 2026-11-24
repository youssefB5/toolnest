import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { assertNotServiceRole, isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * Browser Supabase client for the admin dashboard. Uses ONLY the public anon key;
 * every read/write is authorized by Row Level Security on the server.
 */
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    assertNotServiceRole(SUPABASE_ANON_KEY);
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'tn-admin-auth',
      },
    });
  }
  return client;
}

export type AdminRole = 'owner' | 'admin' | 'editor';
export const ROLE_RANK: Record<AdminRole, number> = { owner: 3, admin: 2, editor: 1 };
export const can = (role: AdminRole | null, min: AdminRole) => !!role && ROLE_RANK[role] >= ROLE_RANK[min];

/** Turn a Supabase/PostgREST error into a readable message. */
export function errMsg(e: unknown): string {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  const o = e as { message?: string; details?: string; hint?: string; code?: string };
  if (o.code === '42501' || /row-level security/i.test(o.message ?? '')) return 'Permission denied: your role does not allow this action.';
  if (o.code === '23505') return 'This value must be unique (another record already uses it).';
  if (o.code === '23503') return 'This record is referenced by other records and cannot be removed.';
  if (o.code === '23514') return `A validation rule rejected the value. ${o.message ?? ''}`;
  return [o.message, o.details, o.hint].filter(Boolean).join(' — ') || 'Request failed';
}
