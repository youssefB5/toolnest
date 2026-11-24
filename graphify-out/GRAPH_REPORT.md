# Graph Report - FREE Tools  (2026-11-24)

## Corpus Check
- 194 files · ~100,740 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 1, (none) 1, .webmanifest 1)

## Summary
- 1103 nodes · 3689 edges · 45 communities (39 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- pdf-tools/shared.tsx
- developer-tools/logic.ts
- image-tools/shared.tsx
- Page Routing & Context
- converter-tools/components.tsx
- MainLayout.astro
- Dev Dependencies
- tool.ts
- merge.ts
- Search & Local Storage
- PDF Operations (pdf-lib)
- localePath
- README.md
- Runtime Dependencies
- ErrorBox
- Safe Markdown Rendering
- index.ts
- ResetButton
- npm Scripts
- security-tools/logic.ts
- ToolLayout.astro
- sections-content.tsx
- TypeScript Config
- Deployment (Cloudflare Workers Free)
- ESLint Config
- Astro Config
- Prettier Config
- PDF.js Asset Copy
- Setup
- tools.ts
- Free-tier limits (verify current values — providers change them)
- text-tools/logic.ts
- PageContext
- Security Middleware
- Env Types
- markdown.ts
- SEO guide
- Security
- @playwright/test
- ToolNest — free, privacy-first online tools
- execute.ts
- FavoritesView.astro
- vitest
- engines

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
- `go()` --indirect_call--> `q()`  [INFERRED]
  src/components/navigation/SearchBox.tsx → scripts/generate-seed.ts

## Import Cycles
- None detected.

## Communities (45 total, 6 thin omitted)

### Community 0 - "pdf-tools/shared.tsx"
Cohesion: 0.08
Nodes (68): pdfjs-dist, react, FileDrop(), FileDropProps, Range(), ToolEnv, ToolEnvContext, useTask() (+60 more)

### Community 1 - "developer-tools/logic.ts"
Cohesion: 0.17
Nodes (25): RFC-8259, JwtDecoder(), UnixTimestampConverter(), UrlEncoder(), ZONES, base64DecodeUtf8(), base64EncodeUtf8(), DecodedJwt (+17 more)

### Community 2 - "image-tools/shared.tsx"
Cohesion: 0.06
Nodes (80): FileRow(), Progress(), useObjectUrl(), FaviconGenerator(), PNG_SIZES, renderSquare(), ImageColorPicker(), Picked (+72 more)

### Community 3 - "Page Routing & Context"
Cohesion: 0.06
Nodes (28): getPageContext(), page, category, page, page, page, page, page (+20 more)

### Community 4 - "converter-tools/components.tsx"
Cohesion: 0.09
Nodes (60): RFC-4180, NumberInput(), Stat(), AgeCalculator(), AspectRatioCalculator(), DateDifferenceCalculator(), DiscountCalculator(), fmt() (+52 more)

### Community 5 - "MainLayout.astro"
Cohesion: 0.09
Nodes (20): banner, items, Props, tone, box, Props, dir(), OG_LOCALE (+12 more)

### Community 6 - "Dev Dependencies"
Cohesion: 0.10
Nodes (28): description, devDependencies, @astrojs/check@^0.9.12, eslint@^10.15.0, jsdom@^29.1.1, prettier@^3.10.1, prettier-plugin-astro@^1.1.2, @types/dompurify@^3.0.5 (+20 more)

### Community 7 - "tool.ts"
Cohesion: 0.13
Nodes (26): astro, HTML_LANG, isLocale(), absoluteUrl(), breadcrumbLd(), hreflangLinks(), PageMeta, siteOrigin() (+18 more)

### Community 8 - "merge.ts"
Cohesion: 0.09
Nodes (44): DEFAULT_PAGES, DEFAULT_PAGES_UPDATED_AT, DefaultPage, DEFAULT_AD_SLOTS, DEFAULT_ADS, DEFAULT_BRANDING, DEFAULT_GENERAL, DEFAULT_HOME_FAQ (+36 more)

### Community 9 - "Search & Local Storage"
Cohesion: 0.14
Nodes (27): arr(), q(), Labels, loadIndex(), Props, SearchBox(), go(), onKeyDown() (+19 more)

### Community 10 - "PDF Operations (pdf-lib)"
Cohesion: 0.12
Nodes (28): pdf-lib, addPageNumbers(), addWatermark(), box(), compressLossless(), copyPagesToNew(), extractPages(), getPdfInfo() (+20 more)

### Community 11 - "localePath"
Cohesion: 0.07
Nodes (33): Props, Props, Icon(), ICONS, cat, href, Props, localePath() (+25 more)

### Community 12 - "README.md"
Cohesion: 0.20
Nodes (5): Admin guide, Roles, Sections, Adding a new tool, Architecture

### Community 13 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (21): dependencies, astro@^7.3.8, dompurify@^3.5.0, exifr@^7.1.3, jszip@^3.10.2, lucide-react@^1.79.0, marked@^18.3.0, pdf-lib@^1.17.1 (+13 more)

### Community 14 - "ErrorBox"
Cohesion: 0.13
Nodes (27): DownloadButton(), ErrorBox(), Notice(), Segmented(), JsonFormatter(), xmlError(), XmlFormatter(), base64ToBytes() (+19 more)

### Community 15 - "Safe Markdown Rendering"
Cohesion: 0.12
Nodes (14): Props, cats, jsonLd, origin, popular, Props, recent, searchLabels (+6 more)

### Community 16 - "index.ts"
Cohesion: 0.18
Nodes (15): Props, IMPLEMENTATIONS, stripLocale(), t(), useT(), ar, DEFAULT_LOCALE, en (+7 more)

### Community 17 - "ResetButton"
Cohesion: 0.27
Nodes (28): Actions(), Checkbox(), CopyButton(), Field(), ResetButton(), Select(), TextArea(), useToolEnv() (+20 more)

### Community 18 - "npm Scripts"
Cohesion: 0.14
Nodes (14): scripts, build, check, deploy, dev, format, lint, prebuild (+6 more)

### Community 19 - "security-tools/logic.ts"
Cohesion: 0.23
Nodes (18): RFC-9562, ANY, PasswordGenerator(), Sha256Hash(), UuidGenerator(), digest(), entropyBits(), generatePassword() (+10 more)

### Community 20 - "ToolLayout.astro"
Cohesion: 0.13
Nodes (13): Props, slot, UI_KEYS_FOR_TOOLS, appLd, btn, cat, crumbs, ld (+5 more)

### Community 21 - "sections-content.tsx"
Cohesion: 0.08
Nodes (93): lucide-react, @supabase/supabase-js, AdminApp(), AdminContext, Ctx, lazyCache, s(), sectionComponent() (+85 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.20
Nodes (9): astro/tsconfigs/strict, compilerOptions, jsx, jsxImportSource, paths, types, exclude, extends (+1 more)

### Community 23 - "Deployment (Cloudflare Workers Free)"
Cohesion: 0.29
Nodes (7): Cloudflare settings, Database backups, Deployment (Cloudflare Workers Free), GitHub, Option A — deploy from your machine, Option B — Git integration (Workers Builds), Why Workers and not Pages

### Community 24 - "ESLint Config"
Cohesion: 0.22
Nodes (8): @eslint/js@^10.0.1, eslint-plugin-astro@^1.7.0, eslint-plugin-react-hooks@^7.1.1, typescript-eslint@^8.74.0, @eslint/js, eslint-plugin-astro, eslint-plugin-react-hooks, typescript-eslint

### Community 25 - "Astro Config"
Cohesion: 0.20
Nodes (8): connectSrc, supabaseOrigin, @astrojs/cloudflare@^14.4.9, @astrojs/react@^7.0.1, @tailwindcss/vite@^4.3.5, @astrojs/cloudflare, @astrojs/react, @tailwindcss/vite

### Community 26 - "Prettier Config"
Cohesion: 0.29
Nodes (6): overrides, plugins, printWidth, semi, singleQuote, trailingComma

### Community 27 - "PDF.js Asset Copy"
Cohesion: 0.20
Nodes (6): dest, require, root, jsonLdString(), root, walk()

### Community 28 - "Setup"
Cohesion: 0.29
Nodes (7): 1. Requirements, 2. Environment variables, 3. Create the Supabase database, 4. Authentication settings, 5. Create the owner (no default credentials exist), 6. Tests, Setup

### Community 29 - "tools.ts"
Cohesion: 0.17
Nodes (16): lines, TOOLS, tr, ui, CATEGORIES, DEVELOPER_TOOLS, IMAGE_TOOLS, CALCULATOR_TOOLS (+8 more)

### Community 30 - "Free-tier limits (verify current values — providers change them)"
Cohesion: 0.33
Nodes (5): Browser-side processing, Cloudflare Workers Free, Free-tier limits (verify current values — providers change them), Nothing paid is required, Supabase Free

### Community 31 - "text-tools/logic.ts"
Cohesion: 0.12
Nodes (29): text(), apply(), addLineNumbers(), CaseMode, CharStats, charStats(), convertCase(), countGraphemes() (+21 more)

### Community 32 - "PageContext"
Cohesion: 0.10
Nodes (16): Props, cats, company, legal, lp(), popular, Props, year (+8 more)

### Community 35 - "markdown.ts"
Cohesion: 0.47
Nodes (5): Web security, ALLOWED_INLINE_TAGS, escapeHtml(), renderSafeMarkdown(), safeUrl()

### Community 36 - "SEO guide"
Cohesion: 0.33
Nodes (5): Content quality, Google Search Console, Preparing for AdSense (no guarantee of approval), SEO guide, What is built in

### Community 37 - "Security"
Cohesion: 0.40
Nodes (4): Database policies (summary), Principles, Reporting, Security

### Community 39 - "ToolNest — free, privacy-first online tools"
Cohesion: 0.50
Nodes (4): Documentation, Project layout, Quick start, ToolNest — free, privacy-first online tools

### Community 41 - "execute.ts"
Cohesion: 0.24
Nodes (9): RegexTester(), getWorker(), RegexTimeoutError, runRegex(), executeRegex(), RegexMatch, RegexRequest, RegexResult (+1 more)

### Community 42 - "FavoritesView.astro"
Cohesion: 0.29
Nodes (6): empty, favs, Props, recent, rh, tools

## Knowledge Gaps
- **4 isolated node(s):** `RFC-4180`, `RFC-8259`, `RFC-9562`, `astro/tsconfigs/strict`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 308 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `pdf-tools/shared.tsx` to `developer-tools/logic.ts`, `image-tools/shared.tsx`, `converter-tools/components.tsx`, `Dev Dependencies`, `Search & Local Storage`, `Runtime Dependencies`, `ErrorBox`, `ResetButton`, `security-tools/logic.ts`, `sections-content.tsx`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `RFC-8259`, `RFC-9562` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pdf-tools/shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08007320979180965 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `developer-tools/logic.ts`, `image-tools/shared.tsx`, `converter-tools/components.tsx`, `Dev Dependencies`, `PDF Operations (pdf-lib)`, `index.ts`, `security-tools/logic.ts`, `PDF.js Asset Copy`, `text-tools/logic.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `image-tools/shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06451033243486073 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `sections-content.tsx` to `pdf-tools/shared.tsx`, `image-tools/shared.tsx`, `Dev Dependencies`, `Search & Local Storage`, `localePath`, `Runtime Dependencies`, `ErrorBox`, `security-tools/logic.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Page Routing & Context` be split into smaller, more focused modules?**
  _Cohesion score 0.05837173579109063 - nodes in this community are weakly interconnected._