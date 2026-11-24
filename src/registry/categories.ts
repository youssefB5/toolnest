import type { CategoryDefinition } from '../types/tool';

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'image-tools',
    slug: 'image-tools',
    icon: 'Image',
    title: 'Image Tools',
    description:
      'Compress, resize, crop, convert and inspect images directly in your browser. Your photos never leave your device.',
    order: 1,
    i18n: {
      fr: {
        title: 'Outils image',
        description:
          'Compressez, redimensionnez, recadrez, convertissez et analysez vos images directement dans votre navigateur. Vos photos ne quittent jamais votre appareil.',
      },
      ar: {
        title: 'أدوات الصور',
        description: 'اضغط الصور وغيّر حجمها واقصصها وحوّلها وافحصها مباشرة في متصفحك. لا تغادر صورك جهازك أبدًا.',
      },
    },
  },
  {
    id: 'pdf-tools',
    slug: 'pdf-tools',
    icon: 'FileText',
    title: 'PDF Tools',
    description:
      'Merge, split, rotate, reorder, number and watermark PDF documents locally, without uploading them anywhere.',
    order: 2,
    i18n: {
      fr: {
        title: 'Outils PDF',
        description:
          'Fusionnez, divisez, faites pivoter, réorganisez, numérotez et filigranez vos PDF localement, sans les envoyer nulle part.',
      },
      ar: {
        title: 'أدوات PDF',
        description: 'ادمج ملفات PDF وقسّمها وأدرها وأعد ترتيبها ورقّمها وأضف علامة مائية محليًا دون رفعها إلى أي مكان.',
      },
    },
  },
  {
    id: 'text-tools',
    slug: 'text-tools',
    icon: 'Type',
    title: 'Text Tools',
    description:
      'Count words, change case, clean up lines, compare texts and generate slugs — fast utilities for writers and editors.',
    order: 3,
    i18n: {
      fr: {
        title: 'Outils texte',
        description:
          'Comptez les mots, changez la casse, nettoyez les lignes, comparez des textes et générez des slugs : des utilitaires rapides pour rédacteurs.',
      },
      ar: {
        title: 'أدوات النصوص',
        description: 'عدّ الكلمات وغيّر حالة الأحرف ونظّف الأسطر وقارن النصوص وأنشئ الروابط المختصرة بسرعة.',
      },
    },
  },
  {
    id: 'developer-tools',
    slug: 'developer-tools',
    icon: 'Code',
    title: 'Developer Tools',
    description:
      'Format JSON and XML, encode and decode data, inspect JWTs, convert timestamps and test regular expressions.',
    order: 4,
    i18n: {
      fr: {
        title: 'Outils développeur',
        description:
          'Formatez JSON et XML, encodez et décodez des données, inspectez des JWT, convertissez des timestamps et testez des expressions régulières.',
      },
      ar: {
        title: 'أدوات المطورين',
        description: 'نسّق JSON وXML، رمّز البيانات وفك ترميزها، افحص رموز JWT، حوّل الطوابع الزمنية واختبر التعابير النمطية.',
      },
    },
  },
  {
    id: 'calculators',
    slug: 'calculators',
    icon: 'Calculator',
    title: 'Calculators',
    description: 'Everyday calculators for percentages, discounts, VAT, ages, date ranges and aspect ratios.',
    order: 5,
    i18n: {
      fr: {
        title: 'Calculatrices',
        description:
          'Des calculatrices du quotidien pour les pourcentages, remises, TVA, âges, écarts de dates et ratios d’image.',
      },
      ar: {
        title: 'الحاسبات',
        description: 'حاسبات يومية للنسب المئوية والخصومات وضريبة القيمة المضافة والأعمار والفترات الزمنية ونسب الأبعاد.',
      },
    },
  },
  {
    id: 'file-converters',
    slug: 'file-converters',
    icon: 'ArrowLeftRight',
    title: 'Converters',
    description: 'Convert CSV and JSON, units of measurement, temperatures, file sizes and color formats.',
    order: 6,
    i18n: {
      fr: {
        title: 'Convertisseurs',
        description:
          'Convertissez CSV et JSON, unités de mesure, températures, tailles de fichiers et formats de couleur.',
      },
      ar: {
        title: 'المحوّلات',
        description: 'حوّل بين CSV وJSON ووحدات القياس ودرجات الحرارة وأحجام الملفات وصيغ الألوان.',
      },
    },
  },
  {
    id: 'productivity-tools',
    slug: 'productivity-tools',
    icon: 'Sparkles',
    title: 'Productivity Tools',
    description: 'Create QR codes, CSS gradients, placeholder text and live Markdown previews in seconds.',
    order: 7,
    i18n: {
      fr: {
        title: 'Outils de productivité',
        description:
          'Créez des QR codes, des dégradés CSS, du texte de remplissage et des aperçus Markdown en quelques secondes.',
      },
      ar: {
        title: 'أدوات الإنتاجية',
        description: 'أنشئ رموز QR وتدرجات CSS ونصوصًا تجريبية ومعاينات Markdown فورية في ثوانٍ.',
      },
    },
  },
  {
    id: 'security-generators',
    slug: 'security-generators',
    icon: 'ShieldCheck',
    title: 'Security & Generators',
    description:
      'Generate strong passwords, UUIDs and SHA-256 hashes using your browser’s cryptographically secure APIs.',
    order: 8,
    i18n: {
      fr: {
        title: 'Sécurité et générateurs',
        description:
          'Générez des mots de passe robustes, des UUID et des empreintes SHA-256 grâce aux API cryptographiques sécurisées de votre navigateur.',
      },
      ar: {
        title: 'الأمان والمولّدات',
        description: 'أنشئ كلمات مرور قوية ومعرّفات UUID وبصمات SHA-256 باستخدام واجهات التشفير الآمنة في متصفحك.',
      },
    },
  },
];

export function getCategoryDef(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}
