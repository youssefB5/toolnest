/** Client-side validation mirroring the database CHECK constraints (the DB remains the authority). */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export type Errors = Record<string, string>;

export function validateToolForm(f: {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  seo_title: string;
  meta_description: string;
  keywords: string;
  instructions: string;
  sort_order: number;
}): Errors {
  const e: Errors = {};
  if (!SLUG_RE.test(f.id) || f.id.length > 80) e.id = 'Lowercase letters, digits and hyphens only (max 80).';
  if (!SLUG_RE.test(f.slug) || f.slug.length > 80) e.slug = 'Lowercase letters, digits and hyphens only (max 80).';
  if (!f.title.trim() || f.title.length > 100) e.title = 'Required, max 100 characters.';
  if (!f.short_description.trim() || f.short_description.length > 300) e.short_description = 'Required, max 300 characters.';
  if (f.description.length > 3000) e.description = 'Max 3000 characters.';
  if (f.seo_title.length > 70) e.seo_title = 'Max 70 characters.';
  if (f.meta_description.length > 170) e.meta_description = 'Max 170 characters.';
  const kw = f.keywords.split(',').map((k) => k.trim()).filter(Boolean);
  if (kw.length > 30) e.keywords = 'Max 30 keywords.';
  if (f.instructions.split('\n').filter((l) => l.trim()).length > 20) e.instructions = 'Max 20 steps.';
  if (!Number.isInteger(f.sort_order) || f.sort_order < 0 || f.sort_order > 100000) e.sort_order = 'Integer between 0 and 100000.';
  return e;
}

/** Validate an imported tool record (Data Export & Backup → Import). */
export function validateImportedTool(r: unknown, keys: readonly string[], categories: string[]): string | null {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'not an object';
  const o = r as Record<string, unknown>;
  const str = (k: string, max: number, required = false) => {
    const v = o[k];
    if (v === undefined || v === null) return required ? `${k} is required` : null;
    if (typeof v !== 'string') return `${k} must be a string`;
    if (required && !v.trim()) return `${k} is required`;
    if (v.length > max) return `${k} is too long`;
    return null;
  };
  if (typeof o.id !== 'string' || !SLUG_RE.test(o.id)) return 'invalid id';
  if (typeof o.slug !== 'string' || !SLUG_RE.test(o.slug)) return 'invalid slug';
  if (typeof o.implementation_key !== 'string' || !keys.includes(o.implementation_key)) return `unknown implementation_key "${String(o.implementation_key)}"`;
  if (typeof o.category_id !== 'string' || !categories.includes(o.category_id)) return `unknown category "${String(o.category_id)}"`;
  for (const [k, max, req] of [
    ['title', 100, true],
    ['short_description', 300, true],
    ['description', 3000, false],
    ['seo_title', 70, false],
    ['meta_description', 170, false],
    ['icon', 40, false],
  ] as const) {
    const err = str(k, max, req);
    if (err) return err;
  }
  if (o.icon !== undefined && o.icon !== null && !/^[A-Za-z0-9]{1,40}$/.test(String(o.icon))) return 'invalid icon';
  if (o.status !== undefined && !['draft', 'published', 'archived'].includes(String(o.status))) return 'invalid status';
  if (o.keywords !== undefined && (!Array.isArray(o.keywords) || o.keywords.some((k) => typeof k !== 'string') || o.keywords.length > 30)) return 'invalid keywords';
  if (o.instructions !== undefined && o.instructions !== null && (!Array.isArray(o.instructions) || o.instructions.some((k) => typeof k !== 'string') || o.instructions.length > 20)) return 'invalid instructions';
  for (const b of ['is_enabled', 'is_featured', 'is_popular', 'is_maintenance']) if (o[b] !== undefined && typeof o[b] !== 'boolean') return `${b} must be boolean`;
  if (o.sort_order !== undefined && (!Number.isInteger(o.sort_order) || (o.sort_order as number) < 0 || (o.sort_order as number) > 100000)) return 'invalid sort_order';
  return null;
}

export const TOOL_IMPORT_FIELDS = [
  'id', 'slug', 'implementation_key', 'category_id', 'icon', 'title', 'short_description', 'description', 'instructions',
  'seo_title', 'meta_description', 'keywords', 'status', 'is_enabled', 'is_featured', 'is_popular', 'is_maintenance', 'sort_order',
] as const;
