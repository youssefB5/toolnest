import type { ToolDefinition } from '../../types/tool';

const local = 'Is my data sent to a server?';
const localA = 'No. Everything runs in your browser. Inputs are never transmitted, logged or stored.';

export const DEVELOPER_TOOLS: ToolDefinition[] = [
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    implementation: 'json-formatter',
    category: 'developer-tools',
    icon: 'Braces',
    title: 'JSON Formatter & Validator',
    short: 'Beautify, minify and validate JSON with precise error positions.',
    keywords: ['json formatter', 'json validator', 'pretty print json', 'minify json', 'json lint'],
    related: ['csv-to-json', 'json-to-csv', 'xml-formatter'],
    addedAt: '2026-09-20',
    popular: true,
    featured: true,
    content: {
      description:
        'Paste JSON from an API response or config file to format it with 2 or 4 spaces or tabs, minify it, or sort object keys. Invalid JSON is reported with the line and column of the problem.',
      steps: ['Paste JSON.', 'Choose Format, Minify or Sort keys.', 'Copy or download the result.'],
      limitations: [
        'Standard JSON only (RFC 8259): comments and trailing commas are reported as errors.',
        'Numbers larger than 2^53 lose precision when re-formatted, as in every JavaScript JSON parser.',
      ],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Formateur et validateur JSON', short: 'Embellissez, minifiez et validez du JSON avec la position exacte des erreurs.' },
      ar: { title: 'منسّق ومدقق JSON', short: 'نسّق JSON واضغطه وتحقق من صحته مع تحديد موضع الخطأ بدقة.' },
    },
  },
  {
    id: 'xml-formatter',
    slug: 'xml-formatter',
    implementation: 'xml-formatter',
    category: 'developer-tools',
    icon: 'FileCode',
    title: 'XML Formatter',
    short: 'Pretty-print or minify XML and check that it is well-formed.',
    keywords: ['xml formatter', 'xml beautifier', 'validate xml', 'minify xml'],
    related: ['json-formatter', 'html-entity-encoder', 'csv-to-json'],
    addedAt: '2026-09-20',
    content: {
      description:
        'Indent XML documents such as sitemaps, RSS feeds, SOAP payloads or Android layouts. The browser’s XML parser checks well-formedness and reports errors.',
      steps: ['Paste XML.', 'Choose indentation and Format or Minify.', 'Copy the result.'],
      limitations: ['Well-formedness only: validation against a DTD or XSD schema is not performed.', 'External entities are never resolved.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Formateur XML', short: 'Indentez ou minifiez du XML et vérifiez qu’il est bien formé.' },
      ar: { title: 'منسّق XML', short: 'نسّق XML أو اضغطه وتحقق من سلامة بنيته.' },
    },
  },
  {
    id: 'url-encoder',
    slug: 'url-encoder',
    implementation: 'url-encoder',
    category: 'developer-tools',
    icon: 'Link2',
    title: 'URL Encoder / Decoder',
    short: 'Percent-encode or decode URLs and query parameters, and inspect URL parts.',
    keywords: ['url encode', 'url decode', 'percent encoding', 'query string'],
    related: ['base64-text', 'html-entity-encoder', 'slug-generator'],
    addedAt: '2026-09-21',
    content: {
      description:
        'Encode text for safe use in a URL (component or full URL mode) or decode %-encoded strings. A breakdown shows the protocol, host, path and each query parameter of a pasted URL.',
      steps: ['Paste text or a URL.', 'Choose Encode or Decode and the mode.', 'Copy the result.'],
      limitations: ['Malformed percent sequences (like “%E0%A4%A”) cannot be decoded and are reported.'],
      faq: [
        { q: local, a: localA },
        { q: 'Component vs full URL?', a: 'Component mode also encodes “/”, “?” and “&”; full URL mode keeps them so the URL stays usable.' },
      ],
    },
    i18n: {
      fr: { title: 'Encodeur / décodeur d’URL', short: 'Encodez ou décodez des URL et paramètres, et analysez leurs composants.' },
      ar: { title: 'ترميز وفك ترميز الروابط', short: 'رمّز الروابط ومعاملاتها أو فك ترميزها وافحص أجزاءها.' },
    },
  },
  {
    id: 'base64-text',
    slug: 'base64-encoder-decoder',
    implementation: 'base64-text',
    category: 'developer-tools',
    icon: 'Binary',
    title: 'Base64 Encoder / Decoder',
    short: 'Encode text to Base64 or decode it, with full UTF-8 and URL-safe support.',
    keywords: ['base64 encode', 'base64 decode', 'base64 converter', 'base64url'],
    related: ['image-to-base64', 'url-encoder', 'jwt-decoder'],
    addedAt: '2026-09-21',
    content: {
      description:
        'Convert text to Base64 and back. Unlike naive converters, accents, Arabic and emoji are handled correctly through UTF-8, and the URL-safe alphabet (Base64URL) used in JWTs is supported.',
      steps: ['Type or paste text.', 'Choose Encode or Decode (and URL-safe if needed).', 'Copy the output.'],
      limitations: ['Decoded binary data that is not valid UTF-8 text is shown with replacement characters.'],
      faq: [
        { q: local, a: localA },
        { q: 'Is Base64 secure?', a: 'No. It is an encoding, not encryption. Never use it to hide passwords.' },
      ],
    },
    i18n: {
      fr: { title: 'Encodeur / décodeur Base64', short: 'Encodez ou décodez du texte en Base64, avec UTF-8 et variante URL-safe.' },
      ar: { title: 'ترميز وفك ترميز Base64', short: 'رمّز النص بصيغة Base64 أو فك ترميزه مع دعم UTF-8 الكامل.' },
    },
  },
  {
    id: 'html-entity-encoder',
    slug: 'html-entity-encoder',
    implementation: 'html-entity-encoder',
    category: 'developer-tools',
    icon: 'CodeXml',
    title: 'HTML Entity Encoder / Decoder',
    short: 'Escape special characters as HTML entities or decode entities back to text.',
    keywords: ['html entities', 'html escape', 'html unescape', 'encode html'],
    related: ['url-encoder', 'xml-formatter', 'markdown-previewer'],
    addedAt: '2026-09-22',
    content: {
      description:
        'Safely display code snippets in a web page by converting <, >, &, quotes and optionally all non-ASCII characters into entities. Decoding understands named (&eacute;), decimal (&#233;) and hex (&#xE9;) entities.',
      steps: ['Paste text or HTML.', 'Choose Encode or Decode.', 'Copy the result.'],
      limitations: ['Decoding is done without executing or rendering the HTML, so tags are returned as plain text.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Encodeur d’entités HTML', short: 'Échappez les caractères spéciaux en entités HTML ou décodez-les.' },
      ar: { title: 'ترميز كيانات HTML', short: 'حوّل الرموز الخاصة إلى كيانات HTML أو أعدها إلى نص.' },
    },
  },
  {
    id: 'jwt-decoder',
    slug: 'jwt-decoder',
    implementation: 'jwt-decoder',
    category: 'developer-tools',
    icon: 'KeyRound',
    title: 'JWT Decoder',
    short: 'Decode a JSON Web Token’s header and payload locally and read its expiry. Does not verify signatures.',
    keywords: ['jwt decoder', 'decode jwt', 'json web token', 'jwt parser'],
    related: ['base64-text', 'unix-timestamp-converter', 'json-formatter'],
    addedAt: '2026-09-22',
    popular: true,
    content: {
      description:
        'Paste a JWT to see its header and payload as formatted JSON, with registered claims (exp, iat, nbf) converted to readable dates and an expired/valid-time indicator. Decoding does NOT verify the signature — anyone can create a token with any payload.',
      steps: ['Paste the token.', 'Read the decoded header, payload and time claims.'],
      limitations: [
        'Signature verification is intentionally not performed: it requires the issuer’s secret or public key. Never trust a token’s contents just because it decodes.',
        'Encrypted tokens (JWE, five parts) cannot be decoded.',
      ],
      faq: [
        { q: 'Is my token sent anywhere?', a: 'No. It is decoded with JavaScript in your browser. Still, avoid pasting production tokens into any website you do not trust.' },
        { q: 'Why not verify the signature?', a: 'Verification needs the secret key; asking you to paste secrets into a web page would be a security risk.' },
      ],
    },
    i18n: {
      fr: { title: 'Décodeur JWT', short: 'Décodez localement l’en-tête et le contenu d’un JWT. Ne vérifie pas la signature.' },
      ar: { title: 'فك ترميز JWT', short: 'فك ترميز رأس ومحتوى رمز JWT محليًا. لا يتحقق من التوقيع.' },
    },
  },
  {
    id: 'unix-timestamp-converter',
    slug: 'unix-timestamp-converter',
    implementation: 'unix-timestamp-converter',
    category: 'developer-tools',
    icon: 'Clock',
    title: 'Unix Timestamp Converter',
    short: 'Convert Unix timestamps (seconds or milliseconds) to dates and back, in any time zone.',
    keywords: ['unix timestamp', 'epoch converter', 'timestamp to date', 'date to timestamp'],
    related: ['date-difference-calculator', 'jwt-decoder', 'age-calculator'],
    addedAt: '2026-09-23',
    content: {
      description:
        'See the current epoch time live, convert a timestamp to ISO 8601, UTC and local time, or turn a date and time into seconds and milliseconds. Seconds vs milliseconds are detected automatically.',
      steps: ['Enter a timestamp or pick a date and time.', 'Choose the time zone.', 'Copy any of the formats.'],
      limitations: ['Dates outside ±8.64×10^15 ms (about ±275,000 years) are not representable in JavaScript.'],
      faq: [{ q: 'What is the Unix epoch?', a: 'The number of seconds elapsed since 1 January 1970 00:00:00 UTC, not counting leap seconds.' }],
    },
    i18n: {
      fr: { title: 'Convertisseur de timestamp Unix', short: 'Convertissez des timestamps Unix en dates et inversement, dans tout fuseau.' },
      ar: { title: 'محوّل الطابع الزمني Unix', short: 'حوّل الطوابع الزمنية إلى تواريخ والعكس في أي منطقة زمنية.' },
    },
  },
  {
    id: 'regex-tester',
    slug: 'regex-tester',
    implementation: 'regex-tester',
    category: 'developer-tools',
    icon: 'Regex',
    title: 'Regex Tester',
    short: 'Test JavaScript regular expressions with live match highlighting and capture groups.',
    keywords: ['regex tester', 'regular expression', 'regex online', 'test regex'],
    related: ['find-and-replace', 'text-diff', 'json-formatter'],
    addedAt: '2026-09-23',
    popular: true,
    content: {
      description:
        'Write a pattern, choose flags (g, i, m, s, u, y) and see every match highlighted in your test string with its index and capture groups. Patterns run in a separate Web Worker with a time limit, so catastrophic backtracking cannot freeze the page.',
      steps: ['Enter a pattern and flags.', 'Paste a test string.', 'Inspect highlighted matches and groups.'],
      limitations: ['JavaScript (ECMAScript) regex flavor; PCRE-only features such as possessive quantifiers are not supported.', 'Evaluation stops after 1.5 seconds or 10,000 matches.'],
      faq: [{ q: local, a: localA }],
    },
    i18n: {
      fr: { title: 'Testeur d’expressions régulières', short: 'Testez des regex JavaScript avec surlignage des correspondances et groupes.' },
      ar: { title: 'مختبر التعابير النمطية', short: 'اختبر التعابير النمطية في JavaScript مع إبراز المطابقات والمجموعات.' },
    },
  },
];
