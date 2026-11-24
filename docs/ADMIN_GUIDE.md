# Admin guide

URL: `/admin/` (never indexed, `noindex` header + robots.txt). Sign in at `/admin/login/`. Sessions refresh automatically and end after 30 minutes of inactivity.

## Roles

| Capability | Editor | Admin | Owner |
| --- | :-: | :-: | :-: |
| Edit tool metadata, publish/unpublish, enable/disable, maintenance | ✓ | ✓ | ✓ |
| Create tool entries (from an existing implementation), archive/restore | ✓ | ✓ | ✓ |
| Delete archived tool entries, delete pages/categories | | ✓ | ✓ |
| Create categories | | ✓ | ✓ |
| Homepage, pages, FAQ, announcements, translations | ✓ | ✓ | ✓ |
| SEO, navigation, ads, branding, general settings | | ✓ | ✓ |
| Activity logs, export/import | | ✓ | ✓ |
| Manage administrators and roles | | | ✓ |

Permissions are enforced by PostgreSQL RLS; hidden buttons are only a convenience.

## Sections

1. **Overview** — counts by status, DB connectivity, recent changes. No traffic/revenue numbers are invented: analytics are not connected.
2. **Tools** — search, filter, sort, bulk publish/unpublish/enable/disable/change category, edit all metadata (title, slug, descriptions, instructions, icon, SEO, keywords, order, featured/popular, maintenance), duplicate, archive/restore, preview. *A new entry can only point to an implementation that exists in the code; editing metadata never creates new functionality.*
3. **Categories** — CRUD, ordering, visibility, SEO. Deletion is blocked while tools use the category.
4. **Homepage** — section titles, order, visibility, hero CTA, SEO introduction (Markdown with preview), FAQ per language. Click **Publish homepage**.
5. **Pages & content** / 12. **Legal pages** — Markdown pages with draft/published status, preview, SEO fields. Built-in slugs (`about`, `contact`, `privacy-policy`, `terms`, `cookie-policy`, `disclaimer`, `help`) override the bundled templates. **Have legal texts reviewed before launch.**
6. **SEO** — defaults, title template, homepage meta, OG image, robots/sitemap switches, Search Console token, SERP preview. Turning off indexing requires confirmation.
7. **Navigation** — extra header links (safe URLs only).
8. **Announcements** — scheduled banners per language.
9. **Advertising** — disabled by default. Requires your approved `ca-pub-…` ID and numeric slot IDs; consent required by default.
10. **Branding** — name, tagline, logo/favicon URLs, colors, theme, copyright, contact email, social links, live preview.
11. **Translations** — per-tool FR/AR fields with coverage. A localized tool page becomes indexable only when title, short description and description are published.
13. **Admin users & roles** — owner adds/changes/suspends/removes admins (never themselves; one owner must remain). Everyone can enable TOTP 2FA here.
14. **Activity logs** — written by database triggers; CSV/JSON download.
15. **Data export & backup** — JSON exports, validated tool import with diff preview, backup instructions (a JSON export is not a full backup).
16. **General settings** — upload size limit, site-wide notice, recently-added section.
17. **System status** — RPC latency, session, registry/catalog consistency.

Public pages are cached ~1–2 minutes, so changes appear shortly after saving.
