import type { APIRoute } from 'astro';
import { isLocale, localePath } from '../../i18n';
import { listedTools } from '../../lib/site/merge';
import { getSiteData } from '../../lib/supabase/public-data';
import type { SearchDoc } from '../../lib/search/fuzzy';

export const GET: APIRoute = async ({ url }) => {
  const param = url.searchParams.get('locale');
  const locale = isLocale(param) ? param : 'en';
  const data = await getSiteData(locale);
  const cats = new Map(data.categories.map((c) => [c.id, c.title]));
  const docs: SearchDoc[] = listedTools(data).map((t) => ({
    id: t.id,
    title: t.title,
    short: t.short,
    keywords: t.keywords,
    category: t.category,
    categoryTitle: cats.get(t.category) ?? t.category,
    href: localePath(locale, `/tools/${t.slug}/`),
    icon: t.icon,
    popular: t.popular || t.featured,
  }));
  return new Response(JSON.stringify(docs), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Robots-Tag': 'noindex',
    },
  });
};
