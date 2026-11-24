import { Component, lazy, Suspense, useMemo, type ComponentType, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import type { ImplementationKey, Locale } from '../../types/tool';
import { ToolEnvContext } from './kit';
import type { ToolUi } from './ui-keys';

type Loader = () => Promise<{ default: ComponentType }>;
const named =
  <M extends Record<string, unknown>>(p: Promise<M>, name: keyof M): Promise<{ default: ComponentType }> =>
    p.then((m) => ({ default: m[name] as ComponentType }));

const text = () => import('../../features/text-tools/components');
const dev = () => import('../../features/developer-tools/components');
const conv = () => import('../../features/converter-tools/components');
const calc = () => import('../../features/calculator-tools/components');
const prod = () => import('../../features/productivity-tools/components');
const sec = () => import('../../features/security-tools/components');

/**
 * Implementation registry: maps each implementation key to its code-split
 * component. Tool-specific libraries (pdf-lib, PDF.js, JSZip, qrcode, marked…)
 * are only downloaded when the matching tool page is opened.
 */
export const IMPLEMENTATIONS: Record<ImplementationKey, Loader> = {
  'image-compressor': () => import('../../features/image-tools/ImageCompressor'),
  'image-resizer': () => import('../../features/image-tools/ImageResizer'),
  'image-cropper': () => import('../../features/image-tools/ImageCropper'),
  'image-converter': () => import('../../features/image-tools/ImageConverter'),
  'image-rotator': () => import('../../features/image-tools/ImageRotator'),
  'image-to-base64': () => import('../../features/image-tools/ImageToBase64'),
  'base64-to-image': () => import('../../features/image-tools/Base64ToImage'),
  'image-color-picker': () => import('../../features/image-tools/ImageColorPicker'),
  'image-metadata-viewer': () => import('../../features/image-tools/ImageMetadataViewer'),
  'image-metadata-remover': () => import('../../features/image-tools/ImageMetadataRemover'),
  'favicon-generator': () => import('../../features/image-tools/FaviconGenerator'),
  'svg-to-png': () => import('../../features/image-tools/SvgToPng'),

  'pdf-merge': () => import('../../features/pdf-tools/PdfMerge'),
  'pdf-split': () => import('../../features/pdf-tools/PdfSplit'),
  'pdf-compress': () => import('../../features/pdf-tools/PdfCompress'),
  'pdf-rotate': () => import('../../features/pdf-tools/PdfRotate'),
  'pdf-extract-pages': () => import('../../features/pdf-tools/PdfExtractPages'),
  'pdf-reorder': () => import('../../features/pdf-tools/PdfReorder'),
  'images-to-pdf': () => import('../../features/pdf-tools/ImagesToPdf'),
  'pdf-to-images': () => import('../../features/pdf-tools/PdfToImages'),
  'pdf-page-numbers': () => import('../../features/pdf-tools/PdfPageNumbers'),
  'pdf-watermark': () => import('../../features/pdf-tools/PdfWatermark'),
  'pdf-page-counter': () => import('../../features/pdf-tools/PdfPageCounter'),
  'pdf-info': () => import('../../features/pdf-tools/PdfInfo'),

  'word-counter': () => named(text(), 'WordCounter'),
  'character-counter': () => named(text(), 'CharacterCounter'),
  'case-converter': () => named(text(), 'CaseConverter'),
  'remove-duplicate-lines': () => named(text(), 'RemoveDuplicateLines'),
  'sort-lines': () => named(text(), 'SortLines'),
  'find-and-replace': () => named(text(), 'FindAndReplace'),
  'text-diff': () => named(text(), 'TextDiff'),
  'slug-generator': () => named(text(), 'SlugGenerator'),
  'line-number-generator': () => named(text(), 'LineNumberGenerator'),

  'json-formatter': () => named(dev(), 'JsonFormatter'),
  'xml-formatter': () => named(dev(), 'XmlFormatter'),
  'url-encoder': () => named(dev(), 'UrlEncoder'),
  'base64-text': () => named(dev(), 'Base64Text'),
  'html-entity-encoder': () => named(dev(), 'HtmlEntityEncoder'),
  'jwt-decoder': () => named(dev(), 'JwtDecoder'),
  'unix-timestamp-converter': () => named(dev(), 'UnixTimestampConverter'),
  'regex-tester': () => named(dev(), 'RegexTester'),

  'csv-to-json': () => named(conv(), 'CsvToJson'),
  'json-to-csv': () => named(conv(), 'JsonToCsv'),
  'unit-converter': () => named(conv(), 'UnitConverter'),
  'temperature-converter': () => named(conv(), 'TemperatureConverter'),
  'file-size-converter': () => named(conv(), 'FileSizeConverter'),
  'color-converter': () => named(conv(), 'ColorConverter'),

  'percentage-calculator': () => named(calc(), 'PercentageCalculator'),
  'discount-calculator': () => named(calc(), 'DiscountCalculator'),
  'vat-calculator': () => named(calc(), 'VatCalculator'),
  'age-calculator': () => named(calc(), 'AgeCalculator'),
  'date-difference-calculator': () => named(calc(), 'DateDifferenceCalculator'),
  'aspect-ratio-calculator': () => named(calc(), 'AspectRatioCalculator'),

  'qr-code-generator': () => named(prod(), 'QrCodeGenerator'),
  'css-gradient-generator': () => named(prod(), 'CssGradientGenerator'),
  'markdown-previewer': () => named(prod(), 'MarkdownPreviewer'),
  'lorem-ipsum-generator': () => named(prod(), 'LoremIpsumGenerator'),

  'uuid-generator': () => named(sec(), 'UuidGenerator'),
  'password-generator': () => named(sec(), 'PasswordGenerator'),
  'sha256-hash': () => named(sec(), 'Sha256Hash'),
};

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const chunk = /dynamically imported module|Loading chunk|Failed to fetch/i.test(this.state.error.message);
      return (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <p className="font-semibold">{chunk ? 'The tool could not be loaded.' : 'Something went wrong in this tool.'}</p>
          <p className="mt-1">{chunk ? 'Check your connection and reload the page.' : this.state.error.message}</p>
          <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ToolRunner({
  implementation,
  locale,
  maxUploadMb,
  ui,
}: {
  implementation: ImplementationKey;
  locale: Locale;
  maxUploadMb: number;
  ui: ToolUi;
}) {
  const Impl = useMemo(() => {
    const loader = IMPLEMENTATIONS[implementation];
    return loader ? lazy(loader) : null;
  }, [implementation]);
  const env = useMemo(() => ({ locale, ui, maxBytes: Math.round(maxUploadMb * 1024 * 1024) }), [locale, ui, maxUploadMb]);
  if (!Impl) return <p role="alert">This tool is not available.</p>;
  return (
    <ToolEnvContext.Provider value={env}>
      <Boundary>
        <Suspense
          fallback={
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500" role="status">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" /> {ui['tool.loading']}
            </div>
          }
        >
          <div className="tool-root space-y-5">
            <Impl />
          </div>
        </Suspense>
      </Boundary>
    </ToolEnvContext.Provider>
  );
}
