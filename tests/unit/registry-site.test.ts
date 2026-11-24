import { describe, expect, it } from 'vitest';
import { TOOLS } from '../../src/registry/tools';
import { CATEGORIES } from '../../src/registry/categories';
import { IMPLEMENTATION_KEYS } from '../../src/types/tool';
import { IMPLEMENTATIONS } from '../../src/components/tools/ToolRunner';
import { ICON_NAMES } from '../../src/components/common/Icon';
import { buildSiteData, listedTools } from '../../src/lib/site/merge';
import { search, type SearchDoc } from '../../src/lib/search/fuzzy';
import { localePath, stripLocale, t } from '../../src/i18n';
import { UI } from '../../src/i18n/ui';

describe('tool registry', () => {
  it('has 60 tools, one per implementation key', () => {
    expect(TOOLS).toHaveLength(60);
    expect(new Set(TOOLS.map((x) => x.implementation)).size).toBe(60);
    expect([...IMPLEMENTATION_KEYS].sort()).toEqual(TOOLS.map((x) => x.implementation).sort());
  });
  it('every implementation key has a component loader', () => {
    for (const k of IMPLEMENTATION_KEYS) expect(typeof IMPLEMENTATIONS[k]).toBe('function');
  });
  it('slugs are unique and URL-safe; categories, icons and related tools exist', () => {
    const slugs = TOOLS.map((x) => x.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const tool of TOOLS) {
      expect(tool.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(CATEGORIES.some((c) => c.id === tool.category)).toBe(true);
      expect(ICON_NAMES).toContain(tool.icon);
      for (const r of tool.related) expect(IMPLEMENTATION_KEYS).toContain(r);
      expect(tool.related).not.toContain(tool.implementation);
    }
  });
  it('every tool has useful, unique content', () => {
    const descriptions = new Set<string>();
    for (const tool of TOOLS) {
      expect(tool.content.description.length).toBeGreaterThan(80);
      expect(tool.content.steps.length).toBeGreaterThanOrEqual(2);
      expect(tool.content.limitations.length).toBeGreaterThanOrEqual(1);
      expect(tool.content.faq.length).toBeGreaterThanOrEqual(1);
      expect(tool.short.length).toBeLessThanOrEqual(160);
      expect(descriptions.has(tool.content.description)).toBe(false);
      descriptions.add(tool.content.description);
      expect(tool.i18n?.fr?.title).toBeTruthy();
      expect(tool.i18n?.ar?.title).toBeTruthy();
    }
  });
  it('every category has at least one tool and fr/ar texts', () => {
    for (const c of CATEGORIES) {
      expect(TOOLS.some((x) => x.category === c.id)).toBe(true);
      expect(c.i18n?.fr?.title && c.i18n?.ar?.title).toBeTruthy();
    }
  });
});

describe('i18n', () => {
  it('all locales define every UI key', () => {
    const keys = Object.keys(UI.en);
    for (const l of ['fr', 'ar'] as const) expect(Object.keys(UI[l]).sort()).toEqual(keys.sort());
  });
  it('builds and strips locale paths', () => {
    expect(localePath('en', '/tools')).toBe('/tools/');
    expect(localePath('fr', '/')).toBe('/fr/');
    expect(localePath('ar', '/tools/x/')).toBe('/ar/tools/x/');
    expect(stripLocale('/fr/tools/x/')).toEqual({ locale: 'fr', path: '/tools/x/' });
    expect(stripLocale('/tools/')).toEqual({ locale: 'en', path: '/tools/' });
    expect(t('fr', 'home.whyTitle', { brand: 'X' })).toBe('Pourquoi utiliser X ?');
  });
});

describe('site data merge (DB + registry)', () => {
  it('falls back to the registry when there is no database', () => {
    const d = buildSiteData('en', null);
    expect(d.source).toBe('registry');
    expect(d.tools).toHaveLength(60);
    expect(d.ads.enabled).toBe(false);
    expect(d.tools.every((x) => x.localized)).toBe(true);
  });
  it('localized registry fallback is marked as not localized', () => {
    const d = buildSiteData('fr', null);
    expect(d.tools[0].title).toBe('Compresseur d’images');
    expect(d.tools[0].localized).toBe(false);
  });
  it('only shows DB tools with a known implementation and applies overrides', () => {
    const d = buildSiteData('en', {
      tools: [
        { id: 'json-formatter', slug: 'json', implementation_key: 'json-formatter', category_id: 'developer-tools', title: 'JSON Pretty', is_enabled: true },
        { id: 'evil', slug: 'evil', implementation_key: 'run-arbitrary-code', category_id: 'developer-tools', title: 'X' },
      ],
    });
    expect(d.tools).toHaveLength(1);
    expect(d.tools[0].title).toBe('JSON Pretty');
    expect(d.tools[0].content.steps.length).toBeGreaterThan(0);
  });
  it('rejects unsafe settings values', () => {
    const d = buildSiteData('en', {
      settings: [
        { key: 'branding', value: { siteName: 'Mine', primaryColor: 'red;}</style><script>', logoUrl: 'javascript:alert(1)', social: [{ label: 'x', url: 'javascript:1' }] } },
        { key: 'ads', value: { enabled: true, provider: 'adsense', adsenseClient: 'not-valid' } },
        { key: 'navigation', value: [{ label: 'Bad', href: 'javascript:alert(1)' }, { label: 'Ok', href: '/about/' }] },
      ],
    });
    expect(d.branding.siteName).toBe('Mine');
    expect(d.branding.primaryColor).toBe('#2563eb');
    expect(d.branding.logoUrl).toBeNull();
    expect(d.branding.social).toHaveLength(0);
    expect(d.ads.enabled).toBe(false);
    expect(d.navigation).toEqual([{ label: 'Ok', href: '/about/' }]);
  });
  it('uses published translations and requires a description to mark a page localized', () => {
    const d = buildSiteData('fr', {
      tools: [{ id: 'word-counter', slug: 'word-counter', implementation_key: 'word-counter', category_id: 'text-tools', title: 'Word Counter' }],
      translations: [
        { locale: 'fr', entity_type: 'tool', entity_id: 'word-counter', field: 'title', value: 'Compteur FR' },
        { locale: 'fr', entity_type: 'tool', entity_id: 'word-counter', field: 'short_description', value: 'Court' },
      ],
    });
    expect(d.tools[0].title).toBe('Compteur FR');
    expect(d.tools[0].localized).toBe(false);
  });
  it('hides disabled tools and hidden categories from listings', () => {
    const d = buildSiteData('en', {
      categories: [{ id: 'text-tools', slug: 'text-tools', is_visible: false }, { id: 'developer-tools', slug: 'developer-tools', is_visible: true }],
      tools: [
        { id: 'word-counter', slug: 'word-counter', implementation_key: 'word-counter', category_id: 'text-tools' },
        { id: 'json-formatter', slug: 'json-formatter', implementation_key: 'json-formatter', category_id: 'developer-tools', is_enabled: false },
        { id: 'jwt-decoder', slug: 'jwt-decoder', implementation_key: 'jwt-decoder', category_id: 'developer-tools' },
      ],
    });
    expect(listedTools(d).map((x) => x.id)).toEqual(['jwt-decoder']);
  });
});

describe('fuzzy search', () => {
  const docs: SearchDoc[] = buildSiteData('en', null).tools.map((x) => ({ id: x.id, title: x.title, short: x.short, keywords: x.keywords, category: x.category, categoryTitle: x.category, href: '', icon: x.icon, popular: x.popular }));
  it('finds by name, keyword and with typos', () => {
    expect(search(docs, 'merge pdf')[0].id).toBe('pdf-merge');
    expect(search(docs, 'jpg to png')[0].id).toBe('image-converter');
    expect(search(docs, 'compres')[0].id).toMatch(/compress/);
    expect(search(docs, 'pasword')[0].id).toBe('password-generator');
  });
  it('returns nothing for gibberish', () => {
    expect(search(docs, 'zzqxj')).toHaveLength(0);
  });
});
