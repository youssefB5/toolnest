import { CATEGORIES } from '../../registry/categories';
import { TOOLS, getToolDefinition } from '../../registry/tools';
import {
  isImplementationKey,
  type CategoryId,
  type FaqItem,
  type Locale,
  type PublicCategory,
  type PublicTool,
} from '../../types/tool';
import { isSafeHref } from '../security/url';
import { DEFAULT_PAGES, DEFAULT_PAGES_UPDATED_AT } from './default-pages';
import {
  DEFAULT_AD_SLOTS,
  DEFAULT_ADS,
  DEFAULT_BRANDING,
  DEFAULT_GENERAL,
  DEFAULT_HOME_FAQ,
  DEFAULT_NAVIGATION,
  DEFAULT_SEO,
  defaultHomepage,
} from './defaults';
import type {
  AdSlot,
  Announcement,
  HomepageSectionId,
  NavItem,
  PageType,
  PublicPage,
  SiteData,
} from './types';

/** Shape returned by the `public_site_payload` SQL function (see supabase/migrations). */
export interface SitePayload {
  settings?: { key: string; value: unknown }[];
  categories?: Record<string, unknown>[];
  tools?: Record<string, unknown>[];
  homepage_sections?: Record<string, unknown>[];
  faqs?: Record<string, unknown>[];
  pages?: Record<string, unknown>[];
  announcements?: Record<string, unknown>[];
  ad_slots?: Record<string, unknown>[];
  translations?: Record<string, unknown>[];
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const strArr = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null;
const HEX = /^#[0-9a-fA-F]{6}$/;

function pick<T extends object>(defaults: T, value: unknown): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...defaults };
  const out = { ...defaults } as Record<string, unknown>;
  for (const [k, d] of Object.entries(defaults)) {
    const v = (value as Record<string, unknown>)[k];
    if (v === undefined || v === null) continue;
    if (typeof d === 'string' && typeof v === 'string') out[k] = v;
    else if (typeof d === 'number' && typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof d === 'boolean' && typeof v === 'boolean') out[k] = v;
    else if (d === null && typeof v === 'string') out[k] = v;
    else if (Array.isArray(d) && Array.isArray(v)) out[k] = v;
  }
  return out as T;
}

type TranslationIndex = Map<string, string>;
const tkey = (type: string, id: string, field: string) => `${type}:${id}:${field}`;

function indexTranslations(rows: Record<string, unknown>[] | undefined, locale: Locale): TranslationIndex {
  const idx: TranslationIndex = new Map();
  if (locale === 'en' || !rows) return idx;
  for (const r of rows) {
    if (r.locale !== locale) continue;
    const v = str(r.value);
    if (!v) continue;
    idx.set(tkey(String(r.entity_type), String(r.entity_id), String(r.field)), v);
  }
  return idx;
}

export function registryTools(locale: Locale): PublicTool[] {
  return TOOLS.map((def, i) => {
    const loc = locale !== 'en' ? def.i18n?.[locale] : undefined;
    return {
      id: def.id,
      slug: def.slug,
      implementation: def.implementation,
      category: def.category,
      icon: def.icon,
      title: loc?.title ?? def.title,
      short: loc?.short ?? def.short,
      seoTitle: null,
      metaDescription: null,
      keywords: def.keywords,
      related: def.related,
      addedAt: def.addedAt,
      popular: !!def.popular,
      featured: !!def.featured,
      enabled: true,
      maintenance: false,
      sortOrder: i + 1,
      fileTool: !!def.fileTool,
      content: def.content,
      localized: locale === 'en',
    };
  });
}

export function registryCategories(locale: Locale): PublicCategory[] {
  return CATEGORIES.map((c) => {
    const loc = locale !== 'en' ? c.i18n?.[locale] : undefined;
    return {
      id: c.id,
      slug: c.slug,
      icon: c.icon,
      title: loc?.title ?? c.title,
      description: loc?.description ?? c.description,
      order: c.order,
      visible: true,
      seoTitle: null,
      metaDescription: null,
    };
  });
}

function mergeTools(rows: Record<string, unknown>[], locale: Locale, tr: TranslationIndex): PublicTool[] {
  const out: PublicTool[] = [];
  const seenSlugs = new Set<string>();
  for (const r of rows) {
    const key = r.implementation_key;
    if (!isImplementationKey(key)) continue; // unknown implementation: cannot run, never shown
    const def = getToolDefinition(key);
    if (!def) continue;
    const id = String(r.id);
    const slug = str(r.slug) ?? def.slug;
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);
    const loc = locale !== 'en' ? def.i18n?.[locale] : undefined;
    const enTitle = str(r.title) ?? def.title;
    const enShort = str(r.short_description) ?? def.short;
    const enDescription = str(r.description) ?? def.content.description;
    const enSteps = strArr(r.instructions) ?? def.content.steps;

    const trTitle = tr.get(tkey('tool', id, 'title'));
    const trShort = tr.get(tkey('tool', id, 'short_description'));
    const trDesc = tr.get(tkey('tool', id, 'description'));
    const trSteps = tr.get(tkey('tool', id, 'instructions'));
    let steps = enSteps;
    if (trSteps) {
      const lines = trSteps.split('\n').map((s) => s.trim()).filter(Boolean);
      if (lines.length) steps = lines;
    }
    const category = (str(r.category_id) ?? def.category) as CategoryId;
    out.push({
      id,
      slug,
      implementation: key,
      category,
      icon: str(r.icon) ?? def.icon,
      title: trTitle ?? loc?.title ?? enTitle,
      short: trShort ?? loc?.short ?? enShort,
      seoTitle: locale === 'en' ? str(r.seo_title) : (tr.get(tkey('tool', id, 'seo_title')) ?? null),
      metaDescription:
        locale === 'en' ? str(r.meta_description) : (tr.get(tkey('tool', id, 'meta_description')) ?? null),
      keywords: strArr(r.keywords) ?? def.keywords,
      related: def.related,
      addedAt: str(r.published_at)?.slice(0, 10) ?? str(r.created_at)?.slice(0, 10) ?? def.addedAt,
      popular: bool(r.is_popular, !!def.popular),
      featured: bool(r.is_featured, !!def.featured),
      enabled: bool(r.is_enabled, true),
      maintenance: bool(r.is_maintenance, false),
      sortOrder: num(r.sort_order, 1000),
      fileTool: !!def.fileTool,
      content: { ...def.content, description: trDesc ?? enDescription, steps },
      localized: locale === 'en' || !!(trTitle && trShort && trDesc),
    });
  }
  return out;
}

function mergeCategories(rows: Record<string, unknown>[], locale: Locale, tr: TranslationIndex): PublicCategory[] {
  const regById = new Map(CATEGORIES.map((c) => [c.id, c]));
  return rows
    .filter((r) => typeof r.id === 'string')
    .map((r) => {
      const id = String(r.id) as CategoryId;
      const reg = regById.get(id);
      const loc = locale !== 'en' ? reg?.i18n?.[locale] : undefined;
      return {
        id,
        slug: str(r.slug) ?? reg?.slug ?? id,
        icon: str(r.icon) ?? reg?.icon ?? 'Folder',
        title: tr.get(tkey('category', id, 'title')) ?? loc?.title ?? str(r.title) ?? reg?.title ?? id,
        description:
          tr.get(tkey('category', id, 'description')) ?? loc?.description ?? str(r.description) ?? reg?.description ?? '',
        order: num(r.sort_order, reg?.order ?? 100),
        visible: bool(r.is_visible, true),
        seoTitle: locale === 'en' ? str(r.seo_title) : null,
        metaDescription: locale === 'en' ? str(r.meta_description) : null,
      };
    });
}

function fillBrand(s: string, brand: string, contactEmail: string, locale: Locale) {
  const contact = contactEmail
    ? locale === 'fr'
      ? `Écrivez-nous à **${contactEmail}**.`
      : `Email us at **${contactEmail}**.`
    : locale === 'fr'
      ? '_L’adresse de contact n’a pas encore été configurée par l’administrateur du site._'
      : '_The contact address has not been configured by the site administrator yet._';
  return s.split('{brand}').join(brand).split('{contact}').join(contact);
}

function defaultPages(locale: Locale, brand: string, contactEmail: string): PublicPage[] {
  return DEFAULT_PAGES.map((p) => {
    const lang = locale === 'fr' ? 'fr' : 'en';
    return {
      slug: p.slug,
      locale,
      type: p.type,
      title: fillBrand(p.title[lang], brand, contactEmail, lang),
      body: fillBrand(p.body[lang], brand, contactEmail, lang),
      seoTitle: null,
      metaDescription: null,
      updatedAt: DEFAULT_PAGES_UPDATED_AT,
      localized: locale === 'en' || locale === 'fr',
    };
  });
}

function mergePages(rows: Record<string, unknown>[], locale: Locale, brand: string, email: string): PublicPage[] {
  const defaults = defaultPages(locale, brand, email);
  const bySlug = new Map<string, PublicPage>(defaults.map((p) => [p.slug, p]));
  const toPage = (r: Record<string, unknown>, localized: boolean): PublicPage | null => {
    const slug = str(r.slug);
    const title = str(r.title);
    if (!slug || !title) return null;
    return {
      slug,
      locale,
      type: (['info', 'legal', 'help', 'custom'].includes(String(r.page_type)) ? r.page_type : 'custom') as PageType,
      title: fillBrand(title, brand, email, locale),
      body: fillBrand(String(r.body_markdown ?? ''), brand, email, locale),
      seoTitle: str(r.seo_title),
      metaDescription: str(r.meta_description),
      updatedAt: (str(r.updated_at) ?? DEFAULT_PAGES_UPDATED_AT).slice(0, 10),
      localized,
    };
  };
  // English DB pages first (fallback), then pages in the requested locale override them.
  for (const r of rows.filter((r) => r.locale === 'en')) {
    const p = toPage(r, locale === 'en');
    if (p) {
      const existing = bySlug.get(p.slug);
      // keep a localized default (e.g. French template) over an English DB fallback
      if (!existing || !existing.localized || locale === 'en') bySlug.set(p.slug, p);
    }
  }
  if (locale !== 'en') {
    for (const r of rows.filter((r) => r.locale === locale)) {
      const p = toPage(r, true);
      if (p) bySlug.set(p.slug, p);
    }
  }
  return [...bySlug.values()];
}

export function buildSiteData(locale: Locale, payload: SitePayload | null, error: string | null = null): SiteData {
  const settings = new Map((payload?.settings ?? []).map((s) => [s.key, s.value]));
  const branding = pick(DEFAULT_BRANDING, settings.get('branding'));
  if (!HEX.test(branding.primaryColor)) branding.primaryColor = DEFAULT_BRANDING.primaryColor;
  if (!HEX.test(branding.accentColor)) branding.accentColor = DEFAULT_BRANDING.accentColor;
  if (!['system', 'light', 'dark'].includes(branding.defaultTheme)) branding.defaultTheme = 'system';
  branding.social = (Array.isArray(branding.social) ? branding.social : [])
    .filter((s): s is { label: string; url: string } => !!s && typeof s.label === 'string' && typeof s.url === 'string')
    .filter((s) => isSafeHref(s.url) && /^https:\/\//.test(s.url));
  if (branding.logoUrl && !isSafeHref(branding.logoUrl)) branding.logoUrl = null;
  if (branding.faviconUrl && !isSafeHref(branding.faviconUrl)) branding.faviconUrl = null;

  const seo = pick(DEFAULT_SEO, settings.get('seo'));
  if (seo.ogImageUrl && !isSafeHref(seo.ogImageUrl)) seo.ogImageUrl = null;
  const general = pick(DEFAULT_GENERAL, settings.get('general'));
  general.maxUploadMb = Math.min(500, Math.max(1, general.maxUploadMb));
  const ads = pick(DEFAULT_ADS, settings.get('ads'));
  if (!/^ca-pub-\d{10,20}$/.test(ads.adsenseClient)) {
    ads.adsenseClient = '';
    ads.enabled = false; // never render ads without a valid, owner-configured publisher ID
  }
  const navRaw = settings.get('navigation');
  const navigation: NavItem[] = Array.isArray(navRaw)
    ? (navRaw as unknown[])
        .filter((n): n is NavItem => !!n && typeof (n as NavItem).label === 'string' && typeof (n as NavItem).href === 'string')
        .filter((n) => isSafeHref(n.href))
        .slice(0, 12)
    : DEFAULT_NAVIGATION;

  const tr = indexTranslations(payload?.translations, locale);

  const tools = payload?.tools ? mergeTools(payload.tools, locale, tr) : registryTools(locale);
  const categories = payload?.categories?.length
    ? mergeCategories(payload.categories, locale, tr)
    : registryCategories(locale);
  categories.sort((a, b) => a.order - b.order);
  tools.sort((a, b) => a.sortOrder - b.sortOrder);

  const homepage = defaultHomepage();
  for (const r of payload?.homepage_sections ?? []) {
    const id = String(r.id) as HomepageSectionId;
    if (!homepage[id]) continue;
    homepage[id] = {
      id,
      enabled: bool(r.is_enabled, true),
      order: num(r.sort_order, homepage[id].order),
      title: tr.get(tkey('homepage', id, 'title')) ?? (locale === 'en' ? str(r.title) : null),
      subtitle: tr.get(tkey('homepage', id, 'subtitle')) ?? (locale === 'en' ? str(r.subtitle) : null),
      body: tr.get(tkey('homepage', id, 'body')) ?? (locale === 'en' ? str(r.body) : null),
      ctaText: tr.get(tkey('homepage', id, 'cta_text')) ?? (locale === 'en' ? str(r.cta_text) : null),
    };
  }

  const faqRows = (payload?.faqs ?? []).slice().sort((a, b) => num(a.sort_order, 0) - num(b.sort_order, 0));
  const toFaq = (r: Record<string, unknown>): FaqItem | null => {
    const q = str(r.question);
    const a = str(r.answer);
    return q && a ? { q, a } : null;
  };
  const homeDb = faqRows.filter((r) => r.scope === 'home' && r.locale === locale).map(toFaq).filter(Boolean) as FaqItem[];
  const homeFaqs = homeDb.length ? homeDb : DEFAULT_HOME_FAQ[locale];
  const toolFaqs: Record<string, FaqItem[]> = {};
  for (const r of faqRows.filter((r) => r.scope === 'tool' && typeof r.tool_id === 'string')) {
    if (r.locale !== locale && r.locale !== 'en') continue;
    const f = toFaq(r);
    if (!f) continue;
    (toolFaqs[String(r.tool_id)] ??= []).push(f);
  }

  const now = Date.now();
  const announcements: Announcement[] = (payload?.announcements ?? [])
    .filter((r) => bool(r.is_active, false))
    .filter((r) => !r.locale || r.locale === locale)
    .filter((r) => !str(r.starts_at) || Date.parse(String(r.starts_at)) <= now)
    .filter((r) => !str(r.ends_at) || Date.parse(String(r.ends_at)) > now)
    .map((r) => ({
      id: String(r.id),
      message: String(r.message ?? ''),
      linkUrl: str(r.link_url) && isSafeHref(String(r.link_url)) ? String(r.link_url) : null,
      level: (['info', 'warning', 'success'].includes(String(r.level)) ? r.level : 'info') as Announcement['level'],
    }))
    .filter((a) => a.message);

  const adSlots: AdSlot[] = DEFAULT_AD_SLOTS.map((d) => {
    const r = (payload?.ad_slots ?? []).find((x) => x.id === d.id);
    if (!r) return d;
    return {
      ...d,
      enabled: bool(r.is_enabled, false),
      adSlotId: /^\d{4,20}$/.test(String(r.ad_slot_id ?? '')) ? String(r.ad_slot_id) : '',
      showDesktop: bool(r.show_desktop, true),
      showMobile: bool(r.show_mobile, true),
      minHeight: Math.min(600, Math.max(50, num(r.min_height, d.minHeight))),
      lazy: bool(r.lazy_load, true),
      label: str(r.label) ?? d.label,
    };
  });

  return {
    source: payload ? 'database' : 'registry',
    fetchedAt: new Date().toISOString(),
    error,
    branding,
    seo,
    general,
    ads,
    navigation,
    tools,
    categories,
    homepage,
    homeFaqs,
    toolFaqs,
    pages: mergePages(payload?.pages ?? [], locale, branding.siteName, branding.contactEmail),
    announcements,
    adSlots,
  };
}

/** Tools that should appear in public listings. */
export function listedTools(data: SiteData): PublicTool[] {
  const visibleCats = new Set(data.categories.filter((c) => c.visible).map((c) => c.id));
  return data.tools.filter((t) => t.enabled && visibleCats.has(t.category));
}
