import { defineMiddleware } from 'astro:middleware';

/**
 * Security headers for every server response. (Astro injects the
 * Content-Security-Policy itself, with hashes; see astro.config.mjs.)
 * Admin, auth and API routes are never indexed and never cached.
 */
export const onRequest = defineMiddleware(async (ctx, next) => {
  const res = await next();
  const h = res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (ctx.url.protocol === 'https:') h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  const p = ctx.url.pathname;
  if (p.startsWith('/admin') || p.startsWith('/api/')) {
    h.set('X-Robots-Tag', 'noindex, nofollow');
    if (p.startsWith('/admin')) h.set('Cache-Control', 'no-store');
  }
  return res;
});
