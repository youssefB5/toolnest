import type { AstroGlobal } from 'astro';
import { isLocale, stripLocale, useT } from '../i18n';
import type { Locale } from '../types/tool';
import { getSiteData } from './supabase/public-data';
import { cspSha256, THEME_INIT_SCRIPT } from './security/csp';

/** Resolve the locale from the `[locale]` route param (or default) and load site data. */
export async function getPageContext(Astro: AstroGlobal) {
  const param = Astro.params.locale;
  let locale: Locale = 'en';
  if (param !== undefined) {
    if (!isLocale(param) || param === 'en') return null;
    locale = param;
  }
  const data = await getSiteData(locale);
  const { path } = stripLocale(Astro.url.pathname);
  await applyPageCsp(Astro, data.ads.enabled && data.ads.provider === 'adsense' && !!data.ads.adsenseClient);
  // Public HTML is cached briefly at the edge/browser; admin changes appear within ~2 minutes.
  Astro.response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
  return { locale, data, t: useT(locale), path };
}

/**
 * Per-request CSP additions. Must run in the page frontmatter (before rendering
 * starts); calls made later from layouts are ignored by Astro.
 */
export async function applyPageCsp(Astro: AstroGlobal, adsActive: boolean) {
  if (!Astro.csp) return;
  Astro.csp.insertScriptHash(await cspSha256(THEME_INIT_SCRIPT));
  if (adsActive) {
    Astro.csp.insertScriptResource('https://pagead2.googlesyndication.com');
    Astro.csp.insertScriptResource('https://partner.googleadservices.com');
    Astro.csp.insertScriptResource('https://tpc.googlesyndication.com');
  }
}

export type PageContext =NonNullable<Awaited<ReturnType<typeof getPageContext>>>;
