import { HTML_LANG, LOCALES, localePath } from '../../i18n';
import type { Locale } from '../../types/tool';
import type { SiteData } from '../site/types';

export interface PageMeta {
  title: string;
  description: string;
  /** Path without locale prefix, e.g. /tools/json-formatter/ */
  path: string;
  locale: Locale;
  /** Locales that have a genuine translation of this page (for hreflang). */
  alternates?: Locale[];
  noindex?: boolean;
  /** Canonical override (absolute path, may include locale) */
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string | null;
  jsonLd?: Record<string, unknown>[];
}

export function siteOrigin(): string {
  return (import.meta.env.SITE || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/$/, '');
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return siteOrigin() + (path.startsWith('/') ? path : `/${path}`);
}

export function formatTitle(data: SiteData, title: string): string {
  const tpl = data.seo.titleTemplate.includes('%s') ? data.seo.titleTemplate : `%s | ${data.branding.siteName}`;
  const full = tpl.replace('%s', title);
  return full.length > 70 && title.length <= 70 ? title : full;
}

export function clampDescription(s: string, max = 160): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length) + '…';
}

export function hreflangLinks(path: string, alternates: Locale[]) {
  const list = alternates.filter((l) => LOCALES.includes(l));
  if (list.length < 2) return [];
  const links = list.map((l) => ({ hreflang: HTML_LANG[l], href: absoluteUrl(localePath(l, path)) }));
  if (list.includes('en')) links.push({ hreflang: 'x-default', href: absoluteUrl(localePath('en', path)) });
  return links;
}

/** Safe JSON-LD serialization: prevents </script> breakouts. */
export function jsonLdString(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
