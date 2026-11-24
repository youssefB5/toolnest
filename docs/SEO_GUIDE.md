# SEO guide

## What is built in

- Server-rendered HTML for every public page; unique `<title>` and meta description per tool/category/page.
- Canonical URLs from `PUBLIC_SITE_URL`; clean URLs (`/tools/image-compressor/`, `/categories/pdf-tools/`, `/fr/…`, `/ar/…`).
- Open Graph + Twitter/X cards; JSON-LD: `WebSite` + `SearchAction`, `Organization`, `BreadcrumbList`, `WebApplication` (free offer), `FAQPage`, `CollectionPage`, `ItemList`.
- `/sitemap.xml` (dynamic, with `hreflang` alternates only for genuinely localized pages) and `/robots.txt` (blocks `/admin`, `/api/`).
- `hreflang` only where a real translation exists. Untranslated FR/AR tool pages show the English guide with a notice, are `noindex`, and canonicalize to English — no duplicate or auto-translated content is published as localized.
- Each tool page has original content: description, steps, formats, limitations, examples, FAQ, related tools (internal linking). Empty categories are `noindex`.
- Fast pages: no JS-heavy framework on the homepage (only the search island, loaded when idle); tool libraries are code-split per tool.

## Google Search Console

1. https://search.google.com/search-console → Add property → **URL prefix** → your `PUBLIC_SITE_URL`.
2. Choose **HTML tag**, copy only the `content="…"` value.
3. Admin → SEO → “Google Search Console verification token” (or set `PUBLIC_GOOGLE_SITE_VERIFICATION` and rebuild). Click Verify.
4. Sitemaps → submit `sitemap.xml`.

## Content quality

Do not create mass pages or keyword-stuff. Before translating a tool, translate its description and steps carefully (Admin → Translations) — that is what makes FR/AR pages indexable.

## Preparing for AdSense (no guarantee of approval)

- Have real, useful content, an About and Contact page with a real contact address, and reviewed Privacy/Cookie policies.
- Apply with your `workers.dev` URL or a custom domain (Google may require a domain you control — a custom domain is often needed).
- After approval: Admin → Advertising → publisher ID + slot IDs per placement → enable. Ads load only after consent by default.
- For EEA/UK/Swiss traffic Google requires a **certified CMP** (IAB TCF) for personalized ads; the built-in banner is a simple consent gate. Use Google's own “Privacy & messaging” CMP or another certified CMP and keep `Require consent` on.
- When ads are enabled the page CSP automatically allows `pagead2.googlesyndication.com`; additional Google domains (frames/images) may be needed — check the browser console and extend `security.csp` in `astro.config.mjs` if necessary.
