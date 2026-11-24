# Architecture

```
Browser ──► Cloudflare Worker (Astro SSR) ──► Supabase PostgREST  (1 RPC: public_site_payload, cached 60 s, 2.5 s timeout)
   │              │ static assets (/_astro, /pdfjs)           ▲
   │              └─ fallback: built-in registry               │ RLS
   └─ Admin SPA (/admin, React) ── supabase-js (anon key + user JWT) ┘
   └─ Tool islands ── Web Workers (image / pdf-lib / regex), PDF.js worker, Canvas — files never uploaded
```

- **Registry** (`src/registry`) is the single source of truth for which processing implementations exist (`IMPLEMENTATION_KEYS`). The DB `tools.implementation_key` is CHECK-constrained to the same list (a test enforces they match).
- **Merge** (`src/lib/site/merge.ts`) overlays DB metadata and published translations onto the registry, validates every value (colors, URLs, ad IDs) and drops entries without code.
- **ToolRunner** maps implementation keys to code-split React components; each tool's heavy libraries load only on its page.
- **Pure logic** lives in `features/*/logic.ts` and is unit-tested in Node.

## Adding a new tool

1. Add the key to `IMPLEMENTATION_KEYS` (`src/types/tool.ts`) and to the CHECK list in a **new** migration (`alter table public.tools drop constraint …; add constraint …`).
2. Add its definition (content, i18n titles) to `src/registry/data/*.ts`.
3. Implement pure logic in `features/<category>/logic.ts` + tests, and the UI component.
4. Register the loader in `IMPLEMENTATIONS` (`src/components/tools/ToolRunner.tsx`).
5. `npm run seed:sql`, insert the new row (or create it from Admin → Tools → New tool entry), `npm test`.
