import type { Locale } from '../types/tool';
import { DEFAULT_LOCALE, LOCALES, RTL_LOCALES, UI, type UiKey } from './ui';

export { LOCALES, DEFAULT_LOCALE, LOCALE_NAMES } from './ui';
export type { UiKey } from './ui';

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as string[]).includes(v);
}

export function dir(locale: Locale): 'rtl' | 'ltr' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

export function t(locale: Locale, key: UiKey, vars?: Record<string, string | number>): string {
  let s = UI[locale]?.[key] ?? UI[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export function useT(locale: Locale) {
  return (key: UiKey, vars?: Record<string, string | number>) => t(locale, key, vars);
}

/** Build a locale-prefixed path. English has no prefix. Paths always end with a slash. */
export function localePath(locale: Locale, path: string): string {
  let p = path.startsWith('/') ? path : `/${path}`;
  if (!p.endsWith('/') && !p.includes('?') && !p.includes('#') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
  if (locale === DEFAULT_LOCALE) return p;
  return p === '/' ? `/${locale}/` : `/${locale}${p}`;
}

/** Remove a locale prefix from a pathname. */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const m = pathname.match(/^\/(fr|ar)(\/.*)?$/);
  if (m) return { locale: m[1] as Locale, path: m[2] || '/' };
  return { locale: DEFAULT_LOCALE, path: pathname || '/' };
}

export const HTML_LANG: Record<Locale, string> = { en: 'en', fr: 'fr', ar: 'ar' };
export const OG_LOCALE: Record<Locale, string> = { en: 'en_US', fr: 'fr_FR', ar: 'ar_AR' };
