import type { Locale } from '../../types/tool';
import { buildSiteData, type SitePayload } from '../site/merge';
import type { SiteData } from '../site/types';
import { assertNotServiceRole, isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * Loads published public content from Supabase in ONE request (an RLS-respecting
 * SQL function), with:
 *  - a short timeout, so a slow database never blocks page rendering,
 *  - a per-isolate memory cache (keeps free-tier request counts low),
 *  - stale-on-error: if Supabase is down we serve the last good copy,
 *  - a full fallback to the built-in registry when nothing is cached.
 * Tools keep working regardless, because their logic lives in the codebase.
 */
const TTL_MS = 60_000;
const TIMEOUT_MS = 2_500;

let cache: { payload: SitePayload; at: number } | null = null;
let inflight: Promise<SitePayload> | null = null;

async function fetchPayload(): Promise<SitePayload> {
  assertNotServiceRole(SUPABASE_ANON_KEY);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/public_site_payload`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: '{}',
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Supabase responded ${res.status}`);
    const json = (await res.json()) as SitePayload;
    if (!json || typeof json !== 'object') throw new Error('Invalid payload');
    return json;
  } finally {
    clearTimeout(timer);
  }
}

export async function getSiteData(locale: Locale): Promise<SiteData> {
  if (!isSupabaseConfigured()) return buildSiteData(locale, null);
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return buildSiteData(locale, cache.payload);
  try {
    inflight ??= fetchPayload().finally(() => {
      inflight = null;
    });
    const payload = await inflight;
    cache = { payload, at: Date.now() };
    return buildSiteData(locale, payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.warn('[site-data] Supabase unavailable, using fallback:', msg);
    if (cache) return { ...buildSiteData(locale, cache.payload), error: `stale: ${msg}` };
    return buildSiteData(locale, null, msg);
  }
}

/** For tests only. */
export function __resetSiteDataCache() {
  cache = null;
  inflight = null;
}
