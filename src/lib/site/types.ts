import type { FaqItem, Locale, PublicCategory, PublicTool } from '../../types/tool';

export interface Branding {
  siteName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string; // #RRGGBB
  accentColor: string; // #RRGGBB
  defaultTheme: 'system' | 'light' | 'dark';
  footerCopyright: string;
  contactEmail: string;
  social: { label: string; url: string }[];
}

export interface SeoSettings {
  defaultTitle: string;
  titleTemplate: string; // "%s | ToolNest"
  defaultDescription: string;
  homeTitle: string;
  homeDescription: string;
  ogImageUrl: string | null;
  twitterHandle: string;
  /** Global switch. Only set to false deliberately (requires confirmation in admin). */
  allowIndexing: boolean;
  sitemapIncludeCategories: boolean;
  sitemapIncludePages: boolean;
  googleSiteVerification: string;
}

export interface GeneralSettings {
  maxUploadMb: number;
  maintenanceBanner: string;
  showRecentlyAdded: boolean;
}

export interface AdsSettings {
  enabled: boolean;
  provider: 'none' | 'adsense';
  adsenseClient: string; // ca-pub-XXXXXXXXXXXXXXXX, empty until approved
  requireConsent: boolean;
}

export interface NavItem {
  label: string;
  href: string;
}

export type HomepageSectionId = 'hero' | 'popular' | 'categories' | 'recent' | 'why' | 'faq' | 'seo';

export interface HomepageSection {
  id: HomepageSectionId;
  enabled: boolean;
  order: number;
  title: string | null;
  subtitle: string | null;
  body: string | null; // markdown (seo section) or CTA text (hero)
  ctaText: string | null;
}

export type PageType = 'info' | 'legal' | 'help' | 'custom';

export interface PublicPage {
  slug: string;
  locale: Locale;
  type: PageType;
  title: string;
  body: string; // markdown
  seoTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  /** false when the content is an English fallback for a missing translation */
  localized: boolean;
}

export interface Announcement {
  id: string;
  message: string;
  linkUrl: string | null;
  level: 'info' | 'warning' | 'success';
}

export type AdPlacement = 'header' | 'home' | 'category' | 'tool' | 'footer';

export interface AdSlot {
  id: AdPlacement;
  enabled: boolean;
  adSlotId: string; // AdSense data-ad-slot (digits)
  showDesktop: boolean;
  showMobile: boolean;
  minHeight: number;
  lazy: boolean;
  label: string;
}

export interface SiteData {
  source: 'database' | 'registry';
  fetchedAt: string;
  error: string | null;
  branding: Branding;
  seo: SeoSettings;
  general: GeneralSettings;
  ads: AdsSettings;
  navigation: NavItem[];
  tools: PublicTool[];
  categories: PublicCategory[];
  homepage: Record<HomepageSectionId, HomepageSection>;
  homeFaqs: FaqItem[];
  toolFaqs: Record<string, FaqItem[]>;
  pages: PublicPage[];
  announcements: Announcement[];
  adSlots: AdSlot[];
}
