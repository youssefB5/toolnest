import type { APIRoute } from 'astro';
import { HTML_LANG, LOCALES, localePath } from '../i18n';
import { absoluteUrl } from '../lib/seo/meta';
import { listedTools } from '../lib/site/merge';
import { getSiteData } from '../lib/supabase/public-data';
import type { Locale } from '../types/tool';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Entry {
  path: string;
  locales: Locale[]; // genuinely localized versions
  lastmod?: string;
}

/**
 * XML sitemap. Only indexable pages are listed: untranslated tool pages,
 * disabled tools, admin and API routes are excluded.
 */
export const GET: APIRoute = async () => {
  const [en, fr, ar] = await Promise.all(LOCALES.map((l) => getSiteData(l)));
  if (!en.seo.allowIndexing) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
  const byLocale = { en, fr, ar };
  const entries: Entry[] = [
    { path: '/', locales: [...LOCALES] },
    { path: '/tools/', locales: [...LOCALES] },
    { path: '/popular/', locales: [...LOCALES] },
    { path: '/recent/', locales: [...LOCALES] },
  ];
  if (en.seo.sitemapIncludeCategories) {
    entries.push({ path: '/categories/', locales: [...LOCALES] });
    const counts = new Map<string, number>();
    for (const t of listedTools(en)) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    for (const c of en.categories.filter((c) => c.visible && (counts.get(c.id) ?? 0) > 0)) entries.push({ path: `/categories/${c.slug}/`, locales: [...LOCALES] });
  }
  for (const t of listedTools(en)) {
    const locales: Locale[] = ['en'];
    for (const l of ['fr', 'ar'] as const) if (byLocale[l].tools.find((x) => x.id === t.id)?.localized) locales.push(l);
    entries.push({ path: `/tools/${t.slug}/`, locales, lastmod: t.addedAt });
  }
  if (en.seo.sitemapIncludePages) {
    for (const p of en.pages) {
      const locales: Locale[] = ['en'];
      for (const l of ['fr', 'ar'] as const) if (byLocale[l].pages.find((x) => x.slug === p.slug)?.localized) locales.push(l);
      const path = ['about', 'contact', 'privacy-policy', 'terms', 'cookie-policy', 'disclaimer', 'help'].includes(p.slug) ? `/${p.slug}/` : `/pages/${p.slug}/`;
      entries.push({ path, locales, lastmod: p.updatedAt });
    }
  }
  const urls: string[] = [];
  for (const e of entries) {
    for (const l of e.locales) {
      const alt =
        e.locales.length > 1
          ? e.locales.map((a) => `<xhtml:link rel="alternate" hreflang="${HTML_LANG[a]}" href="${esc(absoluteUrl(localePath(a, e.path)))}"/>`).join('') +
            `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(absoluteUrl(e.path))}"/>`
          : '';
      urls.push(`<url><loc>${esc(absoluteUrl(localePath(l, e.path)))}</loc>${e.lastmod ? `<lastmod>${esc(e.lastmod)}</lastmod>` : ''}${alt}</url>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
