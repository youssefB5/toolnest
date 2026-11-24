# ToolNest — free, privacy-first online tools

**Live:** https://toolnest.toolnest-app.workers.dev (Cloudflare Workers Free)

60 genuinely functional tools (images, PDF, text, developer, converters, calculators, productivity, security) that run **in the visitor's browser**, plus a private admin dashboard backed by Supabase.

- **Stack:** Astro 7 (SSR) · React 19 islands · TypeScript strict · Tailwind CSS 4 · Cloudflare Workers (official adapter) · Supabase (PostgreSQL, Auth, RLS)
- **Languages:** English, French, Arabic (RTL)
- **No paid APIs**, no uploads during normal processing, no account required for visitors.

## Quick start

```bash
npm install
cp .env.example .env      # optional: Supabase URL + anon key
npm run dev               # http://localhost:4321
npm test                  # unit + security tests (Vitest)
npm run lint
npm run build             # requires Node.js >= 22.23.4 (Astro 7)
```

Without Supabase variables the public site runs entirely from the built-in tool registry; the admin dashboard needs Supabase.

## Documentation

| Topic | File |
| --- | --- |
| Local setup, Supabase project, first owner | [docs/SETUP.md](docs/SETUP.md) |
| Cloudflare Workers deployment, GitHub | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Using the admin dashboard | [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) |
| SEO, Search Console, AdSense preparation | [docs/SEO_GUIDE.md](docs/SEO_GUIDE.md) |
| Security model, RLS policies | [docs/SECURITY.md](docs/SECURITY.md) |
| Free-tier limits | [docs/FREE_TIER_LIMITS.md](docs/FREE_TIER_LIMITS.md) |
| Architecture & adding a tool | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

## Project layout

```
src/
  components/   layout · navigation · common · tools (kit + ToolRunner) · admin
  features/     image-tools · pdf-tools · text-tools · developer-tools · converter-tools
                calculator-tools · productivity-tools · security-tools   (logic.ts = pure, tested)
  registry/     tools.ts · categories.ts · data/*   (single source of truth for implementations)
  lib/          supabase · site (merge/defaults) · seo · security · file-processing · regex · search · storage · ads
  workers/      image.worker.ts · pdf.worker.ts · regex.worker.ts
  i18n/         en / fr / ar UI dictionaries
  layouts/      MainLayout · ToolLayout · AdminLayout
  views/        page views shared by all locales
  pages/        routes ( /, /fr/, /ar/ … /admin/ … sitemap.xml, robots.txt, api/ )
supabase/       migrations/ · seed/ (seed.sql generated from the registry, admin-onboarding.sql)
tests/          unit · security · integration (live RLS, opt-in) · e2e (Playwright)
docs/
```
