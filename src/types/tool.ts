export type Locale = 'en' | 'fr' | 'ar';

export type CategoryId =
  | 'image-tools'
  | 'pdf-tools'
  | 'text-tools'
  | 'developer-tools'
  | 'calculators'
  | 'file-converters'
  | 'productivity-tools'
  | 'security-generators';

/**
 * Implementation keys identify processing code that lives in the codebase.
 * The admin dashboard can only attach metadata to one of these keys —
 * it can never create new processing logic.
 */
export const IMPLEMENTATION_KEYS = [
  // image
  'image-compressor',
  'image-resizer',
  'image-cropper',
  'image-converter',
  'image-rotator',
  'image-to-base64',
  'base64-to-image',
  'image-color-picker',
  'image-metadata-viewer',
  'image-metadata-remover',
  'favicon-generator',
  'svg-to-png',
  // pdf
  'pdf-merge',
  'pdf-split',
  'pdf-compress',
  'pdf-rotate',
  'pdf-extract-pages',
  'pdf-reorder',
  'images-to-pdf',
  'pdf-to-images',
  'pdf-page-numbers',
  'pdf-watermark',
  'pdf-page-counter',
  'pdf-info',
  // text
  'word-counter',
  'character-counter',
  'case-converter',
  'remove-duplicate-lines',
  'sort-lines',
  'find-and-replace',
  'text-diff',
  'slug-generator',
  'line-number-generator',
  // developer
  'json-formatter',
  'xml-formatter',
  'url-encoder',
  'base64-text',
  'html-entity-encoder',
  'jwt-decoder',
  'unix-timestamp-converter',
  'regex-tester',
  // converters
  'csv-to-json',
  'json-to-csv',
  'unit-converter',
  'temperature-converter',
  'file-size-converter',
  'color-converter',
  // calculators
  'percentage-calculator',
  'discount-calculator',
  'vat-calculator',
  'age-calculator',
  'date-difference-calculator',
  'aspect-ratio-calculator',
  // productivity
  'qr-code-generator',
  'css-gradient-generator',
  'markdown-previewer',
  'lorem-ipsum-generator',
  // security & generators
  'uuid-generator',
  'password-generator',
  'sha256-hash',
] as const;

export type ImplementationKey = (typeof IMPLEMENTATION_KEYS)[number];

export function isImplementationKey(v: unknown): v is ImplementationKey {
  return typeof v === 'string' && (IMPLEMENTATION_KEYS as readonly string[]).includes(v);
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ToolContent {
  /** What the tool does (1–3 sentences, original, useful). */
  description: string;
  /** How to use it. */
  steps: string[];
  /** Supported formats / inputs. */
  formats?: string[];
  /** Honest limitations. */
  limitations: string[];
  /** Concrete examples. */
  examples?: string[];
  faq: FaqItem[];
}

export interface LocalizedToolText {
  title: string;
  short: string;
}

export interface ToolDefinition {
  id: ImplementationKey;
  slug: string;
  implementation: ImplementationKey;
  category: CategoryId;
  icon: string;
  title: string;
  short: string;
  keywords: string[];
  related: ImplementationKey[];
  addedAt: string; // ISO date
  popular?: boolean;
  featured?: boolean;
  /** Processes files the user selects (shows the file privacy notice). */
  fileTool?: boolean;
  content: ToolContent;
  i18n?: Partial<Record<Exclude<Locale, 'en'>, LocalizedToolText>>;
}

export interface CategoryDefinition {
  id: CategoryId;
  slug: string;
  icon: string;
  title: string;
  description: string;
  order: number;
  i18n?: Partial<Record<Exclude<Locale, 'en'>, { title: string; description: string }>>;
}

export type ToolStatus = 'draft' | 'published' | 'archived';

/** A tool as exposed to the public site after merging DB metadata with the registry. */
export interface PublicTool {
  id: string;
  slug: string;
  implementation: ImplementationKey;
  category: CategoryId;
  icon: string;
  title: string;
  short: string;
  seoTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  related: string[];
  addedAt: string;
  popular: boolean;
  featured: boolean;
  enabled: boolean;
  maintenance: boolean;
  sortOrder: number;
  fileTool: boolean;
  content: ToolContent;
  /** true when title/short/content are available in the requested locale (not a fallback). */
  localized: boolean;
}

export interface PublicCategory {
  id: CategoryId;
  slug: string;
  icon: string;
  title: string;
  description: string;
  order: number;
  visible: boolean;
  seoTitle: string | null;
  metaDescription: string | null;
}
