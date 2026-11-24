# Setup

## 1. Requirements

- **Node.js ≥ 22.23.4** (Astro 7 refuses older versions) — Node 22 LTS (latest) or Node 24.
- npm 10+, Git.
- Optional: a free [Supabase](https://supabase.com) project (needed for the admin dashboard).

```bash
npm install
npm run dev        # copies PDF.js assets to public/pdfjs, then starts Astro
```

## 2. Environment variables

Copy `.env.example` to `.env`. All variables are **public by design** and are inlined at build time:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Canonical origin, e.g. `https://toolnest.<account>.workers.dev` (no trailing slash) |
| `PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` / publishable key |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional Search Console token |

> **Never** put the `service_role` / secret key or database password in `.env`, `wrangler.jsonc`, or code. The application refuses to start with one (`assertNotServiceRole`). It does not need them: every operation is authorized by Row Level Security.

## 3. Create the Supabase database

1. Create a project (Free plan). Region close to your visitors.
2. **SQL Editor** → run, in order:
   1. `supabase/migrations/20261124000001_schema.sql`
   2. `supabase/migrations/20261124000002_security.sql`
   3. `supabase/seed/seed.sql` (8 categories, 60 tools, FR/AR titles, disabled ad slots)

   Or with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push` and `psql … -f supabase/seed/seed.sql`.
3. Regenerate the seed after changing the registry: `npm run seed:sql`.

## 4. Authentication settings

Supabase Dashboard → **Authentication**:

- **Providers → Email:** enabled. **Disable “Allow new users to sign up”** (no public registration).
- **URL Configuration:** Site URL = your `PUBLIC_SITE_URL`; add `https://<your-domain>/admin/reset-password/` and `http://localhost:4321/admin/reset-password/` to Redirect URLs.
- **Multi-factor (optional):** enable TOTP if you want admins to use 2FA (Admin → Admin Users & Roles → “Set up two-factor authentication”).
- Keep the default rate limits.

## 5. Create the owner (no default credentials exist)

1. Authentication → Users → **Add user** (email + strong password, auto-confirm) or **Invite user**.
2. Edit the email in `supabase/seed/admin-onboarding.sql` and run it in the SQL Editor.
3. Sign in at `/admin/login/`.

Other admins/editors: invite them in Authentication → Users, then the owner assigns a role in **Admin → Admin Users & Roles**.

## 6. Tests

```bash
npm test                       # unit + security (Vitest)
npx playwright install chromium
npm run build && npm run test:e2e   # e2e against `wrangler dev`
```

## 7. Full local stack (Supabase in Docker)

Requires Docker Desktop running. Everything stays on your machine.

```bash
npm run db:start          # Postgres 17 + Auth + REST; applies migrations and seed
npm run db:test-users     # creates owner/admin/editor/user test accounts → .env.test.local (git-ignored)
npm test                  # now also runs the 17 live RLS tests (tests/integration/rls.test.ts)
```

Admin end-to-end with the local stack:

```powershell
# PowerShell — use the values printed by `npx supabase status`
$env:PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
$env:PUBLIC_SUPABASE_ANON_KEY="<anon key from supabase status>"
npm run build
npm run preview:local     # wrangler dev, allowed to reach 127.0.0.1 (local only)
npm run test:e2e          # includes tests/e2e/admin.spec.ts
```

`npm run db:reset` rebuilds the database from the migrations and seed; `npm run db:stop` stops the containers.
`supabase/config.jsonc` configures only this local stack (signup disabled, TOTP enabled); production settings are made in the Supabase dashboard (section 4).

Live RLS tests also run against a remote **dedicated test project** if `SUPABASE_TEST_*` variables point to it — never to production.
