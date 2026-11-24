/**
 * Public Supabase configuration. The anon key is public by design; all
 * authorization is enforced by PostgreSQL Row Level Security policies.
 * The service_role key must NEVER be used anywhere in this codebase.
 */
export const SUPABASE_URL: string = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').trim();
export const SUPABASE_ANON_KEY: string = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export function isSupabaseConfigured(): boolean {
  return /^https:\/\/[a-z0-9.-]+$/i.test(SUPABASE_URL.replace(/\/$/, '')) && SUPABASE_ANON_KEY.length > 20;
}

/** Defensive check: refuse to run with a key that is a service_role JWT. */
export function assertNotServiceRole(key: string): void {
  if (key.startsWith('sb_secret_')) {
    throw new Error('Refusing to use a Supabase secret key in the application. Use the publishable/anon key.');
  }
  try {
    const part = key.split('.')[1];
    if (!part) return;
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (json?.role === 'service_role') {
      throw new Error('Refusing to use a Supabase service_role key in the application. Use the anon key.');
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Refusing')) throw e;
  }
}
