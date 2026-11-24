import type { FaqItem, Locale } from '../../types/tool';
import type {
  AdSlot,
  AdsSettings,
  Branding,
  GeneralSettings,
  HomepageSection,
  HomepageSectionId,
  NavItem,
  SeoSettings,
} from './types';

export const DEFAULT_BRANDING: Branding = {
  siteName: 'ToolNest',
  tagline: 'Free online tools that run in your browser',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#2563eb',
  accentColor: '#0d9488',
  defaultTheme: 'system',
  footerCopyright: 'ToolNest',
  contactEmail: '',
  social: [],
};

export const DEFAULT_SEO: SeoSettings = {
  defaultTitle: 'ToolNest — Free Online Tools',
  titleTemplate: '%s | ToolNest',
  defaultDescription:
    'Free, privacy-first online tools for images, PDFs, text, developers and everyday calculations. No sign-up, files stay on your device.',
  homeTitle: 'ToolNest — Free Online Tools for Images, PDF, Text & Developers',
  homeDescription:
    'Compress images, merge PDFs, format JSON, generate QR codes and passwords — 60 free tools that run locally in your browser. No registration, no uploads.',
  ogImageUrl: null,
  twitterHandle: '',
  allowIndexing: true,
  sitemapIncludeCategories: true,
  sitemapIncludePages: true,
  googleSiteVerification: '',
};

export const DEFAULT_GENERAL: GeneralSettings = {
  maxUploadMb: 50,
  maintenanceBanner: '',
  showRecentlyAdded: true,
};

/** Advertising is disabled by default and no publisher ID is configured. */
export const DEFAULT_ADS: AdsSettings = {
  enabled: false,
  provider: 'none',
  adsenseClient: '',
  requireConsent: true,
};

export const DEFAULT_NAVIGATION: NavItem[] = [];

export const DEFAULT_AD_SLOTS: AdSlot[] = (['header', 'home', 'category', 'tool', 'footer'] as const).map((id) => ({
  id,
  enabled: false,
  adSlotId: '',
  showDesktop: true,
  showMobile: true,
  minHeight: id === 'header' || id === 'footer' ? 90 : 250,
  lazy: true,
  label: 'Advertisement',
}));

const SECTION_ORDER: HomepageSectionId[] = ['hero', 'popular', 'categories', 'recent', 'why', 'faq', 'seo'];

export function defaultHomepage(): Record<HomepageSectionId, HomepageSection> {
  const out = {} as Record<HomepageSectionId, HomepageSection>;
  SECTION_ORDER.forEach((id, i) => {
    out[id] = { id, enabled: true, order: i + 1, title: null, subtitle: null, body: null, ctaText: null };
  });
  return out;
}

export const DEFAULT_HOME_FAQ: Record<Locale, FaqItem[]> = {
  en: [
    {
      q: 'Are these tools really free?',
      a: 'Yes. Every tool is free with no usage limits and no account. The site may display clearly labelled advertising in the future to cover hosting costs.',
    },
    {
      q: 'Are my files uploaded to your server?',
      a: 'No. Images, PDFs and other files are processed locally in your browser with JavaScript, Canvas, Web Workers and WebAssembly. They are not uploaded during normal processing.',
    },
    {
      q: 'Do I need to install anything?',
      a: 'No. The tools work in any modern browser on Windows, macOS, Linux, Android and iOS.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'The default limit is 50 MB per file. Because processing happens on your device, very large files depend on your device’s memory.',
    },
    {
      q: 'Can I use the tools offline?',
      a: 'Once a tool page has loaded, most text and calculator tools keep working without a connection. File tools may need to download their processing library the first time.',
    },
  ],
  fr: [
    {
      q: 'Ces outils sont-ils vraiment gratuits ?',
      a: 'Oui. Tous les outils sont gratuits, sans limite d’utilisation et sans compte. Le site pourra afficher à l’avenir des publicités clairement identifiées pour couvrir l’hébergement.',
    },
    {
      q: 'Mes fichiers sont-ils envoyés sur votre serveur ?',
      a: 'Non. Images, PDF et autres fichiers sont traités localement dans votre navigateur (JavaScript, Canvas, Web Workers, WebAssembly). Ils ne sont pas envoyés lors d’un traitement normal.',
    },
    {
      q: 'Dois-je installer quelque chose ?',
      a: 'Non. Les outils fonctionnent dans tout navigateur récent sous Windows, macOS, Linux, Android et iOS.',
    },
    {
      q: 'Y a-t-il une limite de taille ?',
      a: 'La limite par défaut est de 50 Mo par fichier. Le traitement se faisant sur votre appareil, les très gros fichiers dépendent de sa mémoire.',
    },
    {
      q: 'Puis-je utiliser les outils hors ligne ?',
      a: 'Une fois la page chargée, la plupart des outils texte et calculatrices fonctionnent sans connexion. Les outils fichiers peuvent devoir télécharger leur bibliothèque la première fois.',
    },
  ],
  ar: [
    {
      q: 'هل هذه الأدوات مجانية حقًا؟',
      a: 'نعم. جميع الأدوات مجانية دون حدود للاستخدام ودون حساب. قد يعرض الموقع مستقبلًا إعلانات واضحة لتغطية تكاليف الاستضافة.',
    },
    {
      q: 'هل تُرفع ملفاتي إلى خادمكم؟',
      a: 'لا. تتم معالجة الصور وملفات PDF وغيرها محليًا في متصفحك، ولا تُرفع أثناء المعالجة العادية.',
    },
    { q: 'هل أحتاج إلى تثبيت أي شيء؟', a: 'لا. تعمل الأدوات في أي متصفح حديث على مختلف الأنظمة والأجهزة.' },
    {
      q: 'هل هناك حد لحجم الملف؟',
      a: 'الحد الافتراضي 50 ميغابايت لكل ملف. ولأن المعالجة تتم على جهازك، فإن الملفات الكبيرة جدًا تعتمد على ذاكرة جهازك.',
    },
    {
      q: 'هل يمكن استخدام الأدوات دون اتصال؟',
      a: 'بعد تحميل الصفحة تعمل معظم أدوات النصوص والحاسبات دون اتصال. قد تحتاج أدوات الملفات إلى تنزيل مكتبتها في المرة الأولى.',
    },
  ],
};
