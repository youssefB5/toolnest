# Graph Report - FREE Tools  (2026-11-24)

## Corpus Check
- 197 files · ~102,106 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .jsonc 2, .example 1)

## Summary
- 1130 nodes · 3724 edges · 36 communities (30 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5de5110`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- kit.tsx
- developer-tools/logic.ts
- image-tools/shared.tsx
- Page Routing & Context
- converter-tools/components.tsx
- ConsentBanner.astro
- Dev Dependencies
- MainLayout.astro
- merge.ts
- Search & Local Storage
- PDF Operations (pdf-lib)
- localePath
- Setup
- Runtime Dependencies
- CategoryView.astro
- Safe Markdown Rendering
- index.ts
- ToolsIndexView.astro
- npm Scripts
- security-tools/logic.ts
- ToolLayout.astro
- sections-content.tsx
- TypeScript Config
- Boundary
- devDependencies
- Astro Config
- Prettier Config
- security.test.ts
- text-tools/logic.ts
- PageContext
- Security Middleware
- Env Types
- @playwright/test
- FavoritesView.astro
- vitest

## God Nodes (most connected - your core abstractions)
1. `ResetButton()` - 70 edges
2. `Actions()` - 68 edges
3. `ErrorBox()` - 64 edges
4. `react` - 44 edges
5. `TextArea()` - 39 edges
6. `CopyButton()` - 38 edges
7. `getPageContext()` - 38 edges
8. `Segmented()` - 34 edges
9. `Progress()` - 32 edges
10. `DownloadButton()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `Principles` --references--> `assertNotServiceRole()`  [INFERRED]
  docs/SECURITY.md → src/lib/supabase/config.ts
- `2. Environment variables` --references--> `assertNotServiceRole()`  [INFERRED]
  docs/SETUP.md → src/lib/supabase/config.ts
- `Supabase Free` --references--> `getSiteData()`  [INFERRED]
  docs/FREE_TIER_LIMITS.md → src/lib/supabase/public-data.ts
- `Web security` --references--> `renderSafeMarkdown()`  [INFERRED]
  docs/SECURITY.md → src/lib/security/markdown.ts
- `submit()` --indirect_call--> `pw()`  [INFERRED]
  src/components/admin/ResetPassword.tsx → scripts/setup-local-supabase.mjs

## Import Cycles
- None detected.

## Communities (36 total, 6 thin omitted)

### Community 0 - "kit.tsx"
Cohesion: 0.06
Nodes (148): pdfjs-dist, react, Actions(), Checkbox(), CopyButton(), DownloadButton(), ErrorBox(), Field() (+140 more)

### Community 1 - "developer-tools/logic.ts"
Cohesion: 0.10
Nodes (30): RFC-8259, UnixTimestampConverter(), base64DecodeUtf8(), base64EncodeUtf8(), base64ToBytes(), DecodedJwt, decodeEntities(), decodeJwt() (+22 more)

### Community 2 - "image-tools/shared.tsx"
Cohesion: 0.10
Nodes (42): Range(), ImageCompressor(), Target, ImageConverter(), Mime, ImageMetadataRemover(), ImageResizer(), PRESETS (+34 more)

### Community 3 - "Page Routing & Context"
Cohesion: 0.07
Nodes (29): Props, applyPageCsp(), getPageContext(), cspSha256(), THEME_INIT_SCRIPT, page, page, page (+21 more)

### Community 4 - "converter-tools/components.tsx"
Cohesion: 0.08
Nodes (61): RFC-4180, Stat(), calc(), conv(), AgeCalculator(), AspectRatioCalculator(), DateDifferenceCalculator(), DiscountCalculator() (+53 more)

### Community 5 - "ConsentBanner.astro"
Cohesion: 0.43
Nodes (4): box, Props, autoInitAds(), initAds()

### Community 6 - "Dev Dependencies"
Cohesion: 0.10
Nodes (19): description, jsdom@^29.1.1, prettier@^3.10.1, prettier-plugin-astro@^1.1.2, @types/dompurify@^3.0.5, @types/react-dom@^19.3.0, wrangler@^4.168.0, engines (+11 more)

### Community 7 - "MainLayout.astro"
Cohesion: 0.16
Nodes (18): astro@^7.3.8, astro, HTML_LANG, alternates, canonical, description, Props, absoluteUrl() (+10 more)

### Community 8 - "merge.ts"
Cohesion: 0.05
Nodes (70): lines, TOOLS, tr, ui, DEFAULT_PAGES, DEFAULT_PAGES_UPDATED_AT, DefaultPage, DEFAULT_AD_SLOTS (+62 more)

### Community 9 - "Search & Local Storage"
Cohesion: 0.14
Nodes (27): arr(), q(), Labels, loadIndex(), Props, SearchBox(), go(), onKeyDown() (+19 more)

### Community 10 - "PDF Operations (pdf-lib)"
Cohesion: 0.12
Nodes (28): pdf-lib, addPageNumbers(), addWatermark(), box(), compressLossless(), copyPagesToNew(), extractPages(), getPdfInfo() (+20 more)

### Community 11 - "localePath"
Cohesion: 0.15
Nodes (11): Props, localePath(), lp(), cats, crumbs, lp(), Props, tools (+3 more)

### Community 12 - "Setup"
Cohesion: 0.05
Nodes (34): Admin guide, Roles, Sections, Adding a new tool, Architecture, Cloudflare settings, Database backups, Deployment (Cloudflare Workers Free) (+26 more)

### Community 13 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, dompurify@^3.5.0, exifr@^7.1.3, jszip@^3.10.2, lucide-react@^1.79.0, marked@^18.3.0, pdf-lib@^1.17.1, pdfjs-dist@^6.5.438 (+12 more)

### Community 14 - "CategoryView.astro"
Cohesion: 0.13
Nodes (11): Props, slot, AdPlacement, category, category, collection, crumbs, lp() (+3 more)

### Community 15 - "Safe Markdown Rendering"
Cohesion: 0.11
Nodes (14): Props, cats, jsonLd, origin, popular, Props, recent, searchLabels (+6 more)

### Community 16 - "index.ts"
Cohesion: 0.16
Nodes (17): Props, IMPLEMENTATIONS, dir(), OG_LOCALE, stripLocale(), t(), useT(), ar (+9 more)

### Community 17 - "ToolsIndexView.astro"
Cohesion: 0.14
Nodes (10): Props, cats, crumbs, input, itemList, items, Props, sections (+2 more)

### Community 18 - "npm Scripts"
Cohesion: 0.11
Nodes (19): scripts, build, check, db:reset, db:start, db:stop, db:test-users, deploy (+11 more)

### Community 19 - "security-tools/logic.ts"
Cohesion: 0.12
Nodes (29): RFC-9562, sec(), cap(), escWifi(), gradientCss(), lorem(), paragraph(), pick() (+21 more)

### Community 20 - "ToolLayout.astro"
Cohesion: 0.12
Nodes (14): ToolEnv, ToolUi, UI_KEYS_FOR_TOOLS, appLd, btn, cat, crumbs, ld (+6 more)

### Community 21 - "sections-content.tsx"
Cohesion: 0.08
Nodes (97): lucide-react, @supabase/supabase-js, AdminApp(), AdminContext, Ctx, lazyCache, s(), sectionComponent() (+89 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.20
Nodes (9): astro/tsconfigs/strict, compilerOptions, jsx, jsxImportSource, paths, types, exclude, extends (+1 more)

### Community 24 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, @astrojs/check@^0.9.12, eslint@^10.15.0, @eslint/js@^10.0.1, eslint-plugin-astro@^1.7.0, eslint-plugin-react-hooks@^7.1.1, supabase@^3.4.0, @types/qrcode@^1.5.6 (+13 more)

### Community 25 - "Astro Config"
Cohesion: 0.20
Nodes (8): connectSrc, supabaseOrigin, @astrojs/cloudflare@^14.4.9, @astrojs/react@^7.0.1, @tailwindcss/vite@^4.3.5, @astrojs/cloudflare, @astrojs/react, @tailwindcss/vite

### Community 26 - "Prettier Config"
Cohesion: 0.29
Nodes (6): overrides, plugins, printWidth, semi, singleQuote, trailingComma

### Community 27 - "security.test.ts"
Cohesion: 0.06
Nodes (28): Database policies (summary), Principles, Reporting, Security, Web security, dest, require, root (+20 more)

### Community 31 - "text-tools/logic.ts"
Cohesion: 0.13
Nodes (28): apply(), addLineNumbers(), CaseMode, CharStats, charStats(), convertCase(), countGraphemes(), DedupeOptions (+20 more)

### Community 32 - "PageContext"
Cohesion: 0.08
Nodes (20): Props, banner, items, Props, tone, cats, company, legal (+12 more)

### Community 42 - "FavoritesView.astro"
Cohesion: 0.12
Nodes (14): cat, href, Props, isLocale(), listedTools(), ctx, popular, GET() (+6 more)

## Knowledge Gaps
- **4 isolated node(s):** `RFC-4180`, `RFC-8259`, `RFC-9562`, `astro/tsconfigs/strict`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 325 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `kit.tsx` to `image-tools/shared.tsx`, `converter-tools/components.tsx`, `Dev Dependencies`, `Search & Local Storage`, `Runtime Dependencies`, `security-tools/logic.ts`, `sections-content.tsx`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `RFC-8259`, `RFC-9562` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05759162303664921 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `developer-tools/logic.ts`, `image-tools/shared.tsx`, `converter-tools/components.tsx`, `Dev Dependencies`, `PDF Operations (pdf-lib)`, `index.ts`, `security-tools/logic.ts`, `security.test.ts`, `text-tools/logic.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `developer-tools/logic.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09682539682539683 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `sections-content.tsx` to `kit.tsx`, `image-tools/shared.tsx`, `Dev Dependencies`, `Search & Local Storage`, `Runtime Dependencies`, `security-tools/logic.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `image-tools/shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09935064935064936 - nodes in this community are weakly interconnected._