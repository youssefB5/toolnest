// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// PUBLIC_SITE_URL must be the canonical origin (e.g. https://toolnest.<account>.workers.dev).
// It is used for canonical URLs, sitemap and Open Graph tags.
const site = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

// Supabase origin is only needed for the browser to reach the admin API / public data.
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
/** @param {string} url */
function originOf(url) {
  try {
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
}
const supabaseOrigin = originOf(supabaseUrl);
const connectSrc = ["'self'", supabaseOrigin, supabaseOrigin.replace(/^https:/, 'wss:')]
  .filter(Boolean)
  .join(' ');

export default defineConfig({
  site,
  output: 'server',
  trailingSlash: 'ignore',
  adapter: cloudflare({ imageService: 'passthrough' }),
  // No server sessions are needed: admin auth is handled by Supabase Auth tokens.
  session: false,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    worker: { format: 'es' },
  },
  security: {
    checkOrigin: true,
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        `connect-src ${connectSrc}`,
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "media-src 'self' blob:",
      ],
      // <style> elements are hashed by Astro; style="" attributes (used by React
      // components for dynamic widths/colors) are allowed. Scripts stay hash-only.
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
      scriptDirective: {
        resources: ["'self'"],
      },
    },
  },
});
