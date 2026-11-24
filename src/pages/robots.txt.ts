import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/seo/meta';
import { getSiteData } from '../lib/supabase/public-data';

export const GET: APIRoute = async () => {
  const data = await getSiteData('en');
  const body = data.seo.allowIndexing
    ? ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${absoluteUrl('/sitemap.xml')}`, ''].join('\n')
    : ['# Indexing is disabled in the admin SEO settings.', 'User-agent: *', 'Disallow: /', ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
