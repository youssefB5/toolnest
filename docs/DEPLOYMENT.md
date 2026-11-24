# Deployment (Cloudflare Workers Free)

## Why Workers and not Pages

The official Astro adapter (`@astrojs/cloudflare` v13+, here v14) **removed Cloudflare Pages support**; Cloudflare recommends Workers with static assets for new projects. Workers Free gives you a free `*.workers.dev` subdomain — no custom domain or payment needed.

Configuration lives in `wrangler.jsonc` (entry `@astrojs/cloudflare/entrypoints/server`, static assets from `./dist`, `nodejs_compat`). No KV, D1 or other bindings are required (`session: false` in `astro.config.mjs`).

## Option A — deploy from your machine

```bash
npx wrangler login                 # opens the browser, free account
# set build-time variables (they are inlined in the bundle)
$env:PUBLIC_SITE_URL="https://toolnest.<account>.workers.dev"     # PowerShell
$env:PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
$env:PUBLIC_SUPABASE_ANON_KEY="<anon key>"
npm run deploy                     # astro build && wrangler deploy
```

Preview environment: `npx wrangler deploy --env preview` (worker `toolnest-preview`).

## Option B — Git integration (Workers Builds)

1. Push the repository to GitHub (see below).
2. Cloudflare Dashboard → Workers & Pages → Create → **Import a repository**.
3. Build command `npm run build`, deploy command `npx wrangler deploy`.
4. Settings → Variables (build): `PUBLIC_SITE_URL`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `NODE_VERSION=22.23.4` (or newer).
5. Non-production branches can deploy previews with `npx wrangler versions upload`.

After the first deploy, update `PUBLIC_SITE_URL` if the final URL differs and redeploy (canonical URLs and the sitemap use it). Also add the URL to Supabase Auth redirect URLs.

## Cloudflare settings

- Disable **Auto Minify** for HTML if you enable it on a custom zone (causes hydration mismatches).
- HTTPS is automatic on `workers.dev`. HSTS is sent by the middleware.

## GitHub

```bash
git init
git add .
git commit -m "Initial ToolNest platform"
git branch -M main
git remote add origin https://github.com/<you>/toolnest.git
git push -u origin main
```

`.gitignore` excludes `.env*`, `.dev.vars`, `dist/`, `.wrangler/`, `node_modules/` and generated `public/pdfjs/`. Never commit keys.

## Database backups

Supabase Free has no downloadable automated backups. Use the CLI periodically:

```bash
supabase db dump --linked -f backup-schema.sql
supabase db dump --linked --data-only -f backup-data.sql
```

Store dumps outside the repository (they contain admin emails). Restore with `psql "<connection string>" -f backup-schema.sql -f backup-data.sql`.
