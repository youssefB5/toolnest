import type { ToolDefinition } from '../../types/tool';

const local = 'Is my text sent to a server?';
const localA = 'No. All processing happens in your browser tab. Nothing you type or paste is transmitted or stored.';

export const TEXT_TOOLS: ToolDefinition[] = [
  {
    id: 'word-counter',
    slug: 'word-counter',
    implementation: 'word-counter',
    category: 'text-tools',
    icon: 'WholeWord',
    title: 'Word Counter',
    short: 'Count words, sentences, paragraphs and estimate reading and speaking time.',
    keywords: ['word count', 'count words', 'reading time', 'essay word counter'],
    related: ['character-counter', 'case-converter', 'remove-duplicate-lines'],
    addedAt: '2026-09-15',
    popular: true,
    featured: true,
    content: {
      description:
        'Paste or type your text to get live statistics: words, characters, sentences, paragraphs, average word length, estimated reading time (238 wpm) and speaking time (150 wpm), plus the most frequent words.',
      steps: ['Paste or type text into the editor.', 'Statistics update as you type.', 'Check the keyword density table for repeated words.'],
      limitations: [
        'Words are split on whitespace and punctuation using Unicode-aware rules; languages written without spaces (Chinese, Japanese, Thai) are counted per character group and may differ from specialist tools.',
      ],
      faq: [
        { q: local, a: localA },
        { q: 'Are hyphenated words counted as one?', a: 'Yes, “state-of-the-art” counts as one word, as most word processors do.' },
      ],
    },
    i18n: {
      fr: { title: 'Compteur de mots', short: 'Comptez mots, phrases, paragraphes et estimez le temps de lecture.' },
      ar: { title: 'عدّاد الكلمات', short: 'عدّ الكلمات والجمل والفقرات وقدّر وقت القراءة والإلقاء.' },
    },
  },
  {
    id: 'character-counter',
    slug: 'character-counter',
    implementation: 'character-counter',
    category: 'text-tools',
    icon: 'LetterText',
    title: 'Character Counter',
    short: 'Count characters with and without spaces, bytes and limits for social posts and SEO.',
    keywords: ['character count', 'letter counter', 'tweet length', 'meta description length'],
    related: ['word-counter', 'slug-generator', 'case-converter'],
    addedAt: '2026-09-15',
    content: {
      description:
        'Check text length against real-world limits: characters with and without spaces, UTF-8 bytes, lines, and progress bars for common limits such as SEO titles (60), meta descriptions (160), X posts (280) and SMS (160).',
      steps: ['Type or paste your text.', 'Compare the counts with the limit bars.'],
      limitations: ['Platform limits change over time and some platforms count emoji or links differently; treat the bars as guidance.'],
      faq: [
        { q: local, a: localA },
        { q: 'Why do emoji count as 2?', a: 'The “UTF-16 units” value matches how JavaScript and many platforms count; “characters” counts visible graphemes.' },
      ],
    },
    i18n: {
      fr: { title: 'Compteur de caractères', short: 'Comptez caractères avec/sans espaces, octets et limites des réseaux et du SEO.' },
      ar: { title: 'عدّاد الأحرف', short: 'عدّ الأحرف مع المسافات وبدونها والبايتات وحدود المنشورات وSEO.' },
    },
  },
  {
    id: 'case-converter',
    slug: 'case-converter',
    implementation: 'case-converter',
    category: 'text-tools',
    icon: 'CaseSensitive',
    title: 'Case Converter',
    short: 'Convert text to UPPER, lower, Title, Sentence, camelCase, snake_case, kebab-case and more.',
    keywords: ['case converter', 'uppercase', 'lowercase', 'title case', 'camelcase', 'snake case'],
    related: ['slug-generator', 'word-counter', 'find-and-replace'],
    addedAt: '2026-09-16',
    popular: true,
    content: {
      description:
        'Fix text typed with Caps Lock or reformat identifiers for code. One click converts to UPPERCASE, lowercase, Title Case, Sentence case, aLtErNaTiNg, camelCase, PascalCase, snake_case, CONSTANT_CASE or kebab-case.',
      steps: ['Paste your text.', 'Click the target case.', 'Copy the result.'],
      limitations: ['Title Case keeps short English words (a, of, the…) in lowercase except at the start; other languages may need manual edits.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Convertisseur de casse', short: 'Passez en MAJUSCULES, minuscules, Titre, camelCase, snake_case, kebab-case…' },
      ar: { title: 'محوّل حالة الأحرف', short: 'حوّل النص إلى أحرف كبيرة أو صغيرة أو camelCase أو snake_case وغيرها.' },
    },
  },
  {
    id: 'remove-duplicate-lines',
    slug: 'remove-duplicate-lines',
    implementation: 'remove-duplicate-lines',
    category: 'text-tools',
    icon: 'ListX',
    title: 'Remove Duplicate Lines',
    short: 'Delete repeated lines from a list, with case and whitespace options.',
    keywords: ['remove duplicates', 'dedupe list', 'unique lines', 'duplicate remover'],
    related: ['sort-lines', 'find-and-replace', 'line-number-generator'],
    addedAt: '2026-09-16',
    content: {
      description:
        'Clean email lists, keywords, log extracts or CSV columns. The tool keeps the first occurrence of each line, preserves the original order and reports how many duplicates were removed.',
      steps: ['Paste one item per line.', 'Choose whether to ignore case, trim spaces and drop empty lines.', 'Copy or download the unique lines.'],
      limitations: ['Comparison is exact after the selected normalization; near-duplicates with typos are not detected.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Supprimer les lignes en double', short: 'Supprimez les lignes répétées d’une liste, avec options de casse et d’espaces.' },
      ar: { title: 'إزالة الأسطر المكررة', short: 'احذف الأسطر المكررة من قائمة مع خيارات لحالة الأحرف والمسافات.' },
    },
  },
  {
    id: 'sort-lines',
    slug: 'sort-lines',
    implementation: 'sort-lines',
    category: 'text-tools',
    icon: 'ArrowDownAZ',
    title: 'Sort Text Lines',
    short: 'Sort lines alphabetically, numerically, by length, reverse or shuffle them.',
    keywords: ['sort lines', 'alphabetize list', 'sort alphabetically', 'shuffle lines'],
    related: ['remove-duplicate-lines', 'line-number-generator', 'find-and-replace'],
    addedAt: '2026-09-17',
    content: {
      description:
        'Alphabetize names, order numbers naturally (2 before 10), sort by line length, reverse the order or shuffle randomly with a cryptographically secure shuffle.',
      steps: ['Paste your lines.', 'Choose the sort mode and direction.', 'Copy the sorted list.'],
      limitations: ['Alphabetical sorting uses your browser’s locale-aware comparison, which may order accented letters differently than strict byte order.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Trier des lignes', short: 'Triez des lignes par ordre alphabétique, numérique, par longueur, ou mélangez-les.' },
      ar: { title: 'ترتيب الأسطر', short: 'رتّب الأسطر أبجديًا أو رقميًا أو حسب الطول أو اعكسها أو اخلطها.' },
    },
  },
  {
    id: 'find-and-replace',
    slug: 'find-and-replace',
    implementation: 'find-and-replace',
    category: 'text-tools',
    icon: 'Replace',
    title: 'Find and Replace',
    short: 'Replace words or patterns in text, with case, whole-word and regex options.',
    keywords: ['find and replace', 'replace text', 'bulk replace', 'regex replace'],
    related: ['regex-tester', 'case-converter', 'remove-duplicate-lines'],
    addedAt: '2026-09-17',
    content: {
      description:
        'Make bulk edits without opening a word processor. Search plain text or a regular expression, match whole words only, and see how many replacements were made.',
      steps: ['Paste your text.', 'Enter the search and replacement values and choose options.', 'Click “Replace all” and copy the result.'],
      limitations: ['Regex mode uses JavaScript syntax. Expensive patterns are stopped after a time limit to keep the page responsive.'],
      faq: [
        { q: local, a: localA },
        { q: 'Can I use capture groups?', a: 'Yes, in regex mode use $1, $2… in the replacement.' },
      ],
    },
    i18n: {
      fr: { title: 'Rechercher et remplacer', short: 'Remplacez des mots ou motifs, avec casse, mot entier et expressions régulières.' },
      ar: { title: 'البحث والاستبدال', short: 'استبدل الكلمات أو الأنماط في النص مع خيارات حالة الأحرف والتعابير النمطية.' },
    },
  },
  {
    id: 'text-diff',
    slug: 'text-diff',
    implementation: 'text-diff',
    category: 'text-tools',
    icon: 'GitCompare',
    title: 'Text Diff Checker',
    short: 'Compare two texts and highlight added, removed and unchanged lines or words.',
    keywords: ['diff checker', 'compare text', 'text difference', 'compare documents'],
    related: ['find-and-replace', 'remove-duplicate-lines', 'json-formatter'],
    addedAt: '2026-09-18',
    popular: true,
    content: {
      description:
        'Paste an original and a modified version to see exactly what changed. Line mode is ideal for code and lists; word mode for prose. The comparison uses a longest-common-subsequence algorithm.',
      steps: ['Paste the original text on the left and the changed text on the right.', 'Choose line or word mode.', 'Click “Compare”.'],
      limitations: ['Very large inputs (over 10,000 lines each) are compared in a reduced mode to protect performance.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Comparateur de texte', short: 'Comparez deux textes et surlignez les lignes ou mots ajoutés et supprimés.' },
      ar: { title: 'مقارنة النصوص', short: 'قارن بين نصين وميّز الأسطر أو الكلمات المضافة والمحذوفة.' },
    },
  },
  {
    id: 'slug-generator',
    slug: 'slug-generator',
    implementation: 'slug-generator',
    category: 'text-tools',
    icon: 'Link',
    title: 'URL Slug Generator',
    short: 'Turn titles into clean, SEO-friendly URL slugs, with accent transliteration.',
    keywords: ['slug generator', 'url slug', 'permalink', 'seo url'],
    related: ['case-converter', 'url-encoder', 'character-counter'],
    addedAt: '2026-09-18',
    content: {
      description:
        'Convert any title such as “Crème Brûlée: 10 Easy Tips!” into “creme-brulee-10-easy-tips”. Accents are transliterated, punctuation removed and you can choose the separator, lowercase and a maximum length.',
      steps: ['Type a title (one per line for bulk).', 'Adjust options.', 'Copy the slugs.'],
      limitations: ['Non-Latin scripts (Arabic, Cyrillic…) are kept as Unicode letters unless you enable “ASCII only”, which removes them.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Générateur de slug d’URL', short: 'Transformez des titres en slugs d’URL propres et optimisés SEO.' },
      ar: { title: 'مولّد الروابط اللطيفة', short: 'حوّل العناوين إلى روابط نظيفة ملائمة لمحركات البحث.' },
    },
  },
  {
    id: 'line-number-generator',
    slug: 'line-number-generator',
    implementation: 'line-number-generator',
    category: 'text-tools',
    icon: 'ListOrdered',
    title: 'Line Number Generator',
    short: 'Add line numbers to text with custom start, step, padding and separator.',
    keywords: ['add line numbers', 'number lines', 'line numbering'],
    related: ['sort-lines', 'remove-duplicate-lines', 'text-diff'],
    addedAt: '2026-09-19',
    content: {
      description:
        'Prefix every line with its number — handy for code reviews, legal drafts, scripts and lists. Choose the start number, step, zero padding, separator and whether empty lines are numbered.',
      steps: ['Paste your text.', 'Set start, step, padding and separator.', 'Copy the numbered text.'],
      limitations: ['Line breaks are detected for Windows (CRLF), Unix (LF) and old Mac (CR) text.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Numéroteur de lignes', short: 'Ajoutez des numéros de ligne avec départ, pas, remplissage et séparateur.' },
      ar: { title: 'مولّد ترقيم الأسطر', short: 'أضف أرقامًا للأسطر مع تحديد البداية والخطوة والفاصل.' },
    },
  },
];
