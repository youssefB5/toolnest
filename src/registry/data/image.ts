import type { ToolDefinition } from '../../types/tool';

const privacy = 'Is my image uploaded?';
const privacyA =
  'No. The image is decoded and processed by your own browser using the Canvas API. Nothing is sent to our server.';

export const IMAGE_TOOLS: ToolDefinition[] = [
  {
    id: 'image-compressor',
    slug: 'image-compressor',
    implementation: 'image-compressor',
    category: 'image-tools',
    icon: 'Minimize2',
    title: 'Image Compressor',
    short: 'Reduce JPG, PNG and WebP file sizes with a quality slider and instant before/after comparison.',
    keywords: ['compress image', 'reduce image size', 'jpg compressor', 'png', 'webp', 'optimize photo'],
    related: ['image-resizer', 'image-converter', 'image-metadata-remover'],
    addedAt: '2026-09-01',
    popular: true,
    featured: true,
    fileTool: true,
    content: {
      description:
        'Shrink photos and graphics before sharing them by email, uploading them to a CMS or attaching them to a form. The compressor re-encodes each image at the quality you choose and shows the exact size saved, so you can find the balance between file size and visual quality.',
      steps: [
        'Drop one or more images on the upload area or click “Select files”.',
        'Choose the output format (keep original, JPEG or WebP) and adjust the quality slider.',
        'Click “Compress” and compare the original and compressed sizes.',
        'Download each image individually or all of them as a ZIP archive.',
      ],
      formats: ['JPEG (.jpg, .jpeg)', 'PNG (.png)', 'WebP (.webp)'],
      limitations: [
        'PNG is a lossless format: the quality slider has no effect when the output is PNG. Convert to WebP or JPEG for large savings.',
        'Re-encoding an image that is already heavily compressed can produce a larger file. In that case the original is the better choice and the tool tells you so.',
        'Animated images are flattened to their first frame.',
      ],
      examples: [
        'A 4.2 MB smartphone photo exported as JPEG at 75% quality typically drops below 1 MB with no visible difference on screen.',
      ],
      faq: [
        { q: privacy, a: privacyA },
        {
          q: 'What quality setting should I use?',
          a: 'For photos, 70–80% is usually indistinguishable from the original on screen. For text screenshots, keep 85% or higher, or use PNG.',
        },
        {
          q: 'Does compression remove EXIF metadata?',
          a: 'Yes. Re-encoding through the canvas discards EXIF data such as GPS location and camera details.',
        },
      ],
    },
    i18n: {
      fr: {
        title: 'Compresseur d’images',
        short: 'Réduisez le poids des JPG, PNG et WebP avec un curseur de qualité et une comparaison avant/après.',
      },
      ar: { title: 'ضاغط الصور', short: 'قلّل حجم صور JPG وPNG وWebP مع شريط للجودة ومقارنة فورية قبل وبعد.' },
    },
  },
  {
    id: 'image-resizer',
    slug: 'image-resizer',
    implementation: 'image-resizer',
    category: 'image-tools',
    icon: 'Scaling',
    title: 'Image Resizer',
    short: 'Resize images to exact pixel dimensions or common presets while keeping the aspect ratio.',
    keywords: ['resize image', 'change image size', 'image dimensions', 'scale photo', 'pixels'],
    related: ['image-cropper', 'image-compressor', 'aspect-ratio-calculator'],
    addedAt: '2026-09-01',
    popular: true,
    fileTool: true,
    content: {
      description:
        'Set an exact width and height in pixels, or pick a preset such as Full HD, an Instagram post or a profile picture. With the aspect-ratio lock enabled, changing one dimension updates the other automatically so the picture is never stretched.',
      steps: [
        'Select an image.',
        'Enter a width or height, or click a preset.',
        'Keep “Lock aspect ratio” on to avoid distortion.',
        'Click “Resize” and download the result.',
      ],
      formats: ['JPEG', 'PNG', 'WebP', 'GIF and BMP (exported as PNG)'],
      limitations: [
        'Enlarging a small image cannot add detail; it will look softer.',
        'Very large outputs (above about 16,000 px per side) may exceed your browser’s canvas limit.',
      ],
      faq: [
        { q: privacy, a: privacyA },
        {
          q: 'Which resampling method is used?',
          a: 'The browser’s high-quality image smoothing. For strong reductions the tool downsizes in steps to avoid jagged edges.',
        },
      ],
    },
    i18n: {
      fr: {
        title: 'Redimensionner une image',
        short: 'Redimensionnez vos images au pixel près ou via des formats prédéfinis, sans déformation.',
      },
      ar: { title: 'تغيير حجم الصورة', short: 'غيّر أبعاد الصور بدقة بالبكسل أو بقوالب جاهزة مع الحفاظ على النسبة.' },
    },
  },
  {
    id: 'image-cropper',
    slug: 'image-cropper',
    implementation: 'image-cropper',
    category: 'image-tools',
    icon: 'Crop',
    title: 'Image Cropper',
    short: 'Crop images interactively with freeform selection or fixed ratios like 1:1, 4:3 and 16:9.',
    keywords: ['crop image', 'cut photo', 'square crop', '16:9', 'trim image'],
    related: ['image-resizer', 'image-rotator', 'aspect-ratio-calculator'],
    addedAt: '2026-09-02',
    fileTool: true,
    content: {
      description:
        'Draw a selection directly on your image and export only that area. Choose freeform cropping or lock the selection to a ratio — ideal for avatars, thumbnails, banners and social media posts.',
      steps: [
        'Select an image.',
        'Choose a ratio (or Freeform) and drag on the preview to draw the crop area. Drag inside the selection to move it.',
        'Fine-tune with the X, Y, width and height fields if needed.',
        'Click “Crop” and download.',
      ],
      formats: ['JPEG', 'PNG', 'WebP'],
      limitations: ['The crop is exported at the original resolution of the selected area; use the resizer afterwards if needed.'],
      faq: [
        { q: privacy, a: privacyA },
        { q: 'Can I use the keyboard?', a: 'Yes. All crop coordinates can be edited in numeric fields.' },
      ],
    },
    i18n: {
      fr: { title: 'Recadrer une image', short: 'Recadrez vos images librement ou selon un ratio fixe (1:1, 4:3, 16:9).' },
      ar: { title: 'قص الصور', short: 'اقصص الصور تفاعليًا بتحديد حر أو بنسب ثابتة مثل 1:1 و16:9.' },
    },
  },
  {
    id: 'image-converter',
    slug: 'image-converter',
    implementation: 'image-converter',
    category: 'image-tools',
    icon: 'RefreshCw',
    title: 'Image Converter',
    short: 'Convert between JPG, PNG and WebP in batch, with transparency handling.',
    keywords: ['jpg to png', 'png to jpg', 'webp to jpg', 'convert image', 'webp converter'],
    related: ['image-compressor', 'svg-to-png', 'favicon-generator'],
    addedAt: '2026-09-02',
    popular: true,
    fileTool: true,
    content: {
      description:
        'Change the format of one or many images at once: JPG to PNG, PNG to JPG, JPG or PNG to WebP, and WebP back to JPG or PNG. When converting a transparent image to JPEG, you choose the background color that replaces transparency.',
      steps: [
        'Select images.',
        'Pick the target format and, for JPEG/WebP, a quality.',
        'Choose the background color used for transparent areas when exporting to JPEG.',
        'Convert and download individually or as a ZIP.',
      ],
      formats: ['Input: JPEG, PNG, WebP, GIF, BMP, AVIF (if your browser decodes it)', 'Output: JPEG, PNG, WebP'],
      limitations: [
        'Output formats depend on your browser. Some older Safari versions cannot encode WebP; the tool detects this and tells you.',
        'JPEG does not support transparency.',
      ],
      faq: [
        { q: privacy, a: privacyA },
        { q: 'Is WebP smaller than JPEG?', a: 'Usually 25–35% smaller at similar visual quality, and it supports transparency.' },
      ],
    },
    i18n: {
      fr: { title: 'Convertisseur d’images', short: 'Convertissez entre JPG, PNG et WebP par lots, avec gestion de la transparence.' },
      ar: { title: 'محول الصور', short: 'حوّل بين JPG وPNG وWebP دفعة واحدة مع معالجة الشفافية.' },
    },
  },
  {
    id: 'image-rotator',
    slug: 'image-rotator',
    implementation: 'image-rotator',
    category: 'image-tools',
    icon: 'RotateCw',
    title: 'Rotate & Flip Image',
    short: 'Rotate images by 90°, 180° or 270° and flip them horizontally or vertically.',
    keywords: ['rotate image', 'flip image', 'mirror photo', 'turn picture'],
    related: ['image-cropper', 'image-resizer', 'pdf-rotate'],
    addedAt: '2026-09-03',
    fileTool: true,
    content: {
      description:
        'Fix sideways photos and mirrored selfies. Combine a rotation with a horizontal or vertical flip and preview the result before downloading.',
      steps: ['Select an image.', 'Click the rotate and flip buttons until the preview looks right.', 'Download the result.'],
      formats: ['JPEG', 'PNG', 'WebP'],
      limitations: ['JPEG images are re-encoded (at 92% quality), which is not strictly lossless.'],
      faq: [
        { q: privacy, a: privacyA },
        {
          q: 'Why does my photo look rotated in some apps only?',
          a: 'Cameras often store orientation in EXIF instead of rotating pixels. This tool writes the pixels in the final orientation, so every app shows it the same way.',
        },
      ],
    },
    i18n: {
      fr: { title: 'Pivoter et retourner une image', short: 'Faites pivoter vos images de 90°, 180° ou 270° et retournez-les en miroir.' },
      ar: { title: 'تدوير الصور وقلبها', short: 'أدر الصور بزاوية 90° أو 180° أو 270° واقلبها أفقيًا أو عموديًا.' },
    },
  },
  {
    id: 'image-to-base64',
    slug: 'image-to-base64',
    implementation: 'image-to-base64',
    category: 'image-tools',
    icon: 'Binary',
    title: 'Image to Base64',
    short: 'Encode an image as a Base64 data URI for HTML, CSS or JSON.',
    keywords: ['image to base64', 'data uri', 'base64 encode image', 'inline image css'],
    related: ['base64-to-image', 'base64-text', 'svg-to-png'],
    addedAt: '2026-09-03',
    fileTool: true,
    content: {
      description:
        'Turn a small image into a Base64 string you can embed directly in HTML (<img src="data:...">), CSS (background-image) or a JSON payload. Copy the result or download it as a text file.',
      steps: ['Select an image.', 'Choose the output style: raw Base64, data URI, HTML tag or CSS rule.', 'Copy or download.'],
      formats: ['Any image type your browser accepts, including SVG and ICO'],
      limitations: [
        'Base64 is about 33% larger than the binary file. Inline only small images (icons, logos); large images are better served as files.',
      ],
      faq: [
        { q: privacy, a: 'No. The file is read locally with the FileReader API and never uploaded.' },
        { q: 'Is Base64 encryption?', a: 'No. It is a reversible encoding that anyone can decode.' },
      ],
    },
    i18n: {
      fr: { title: 'Image vers Base64', short: 'Encodez une image en Base64 (data URI) pour HTML, CSS ou JSON.' },
      ar: { title: 'تحويل الصورة إلى Base64', short: 'رمّز الصورة بصيغة Base64 لاستخدامها في HTML أو CSS أو JSON.' },
    },
  },
  {
    id: 'base64-to-image',
    slug: 'base64-to-image',
    implementation: 'base64-to-image',
    category: 'image-tools',
    icon: 'ImageDown',
    title: 'Base64 to Image',
    short: 'Decode a Base64 string or data URI back into a viewable, downloadable image.',
    keywords: ['base64 to image', 'decode base64 image', 'data uri to png', 'base64 viewer'],
    related: ['image-to-base64', 'base64-text', 'image-converter'],
    addedAt: '2026-09-03',
    content: {
      description:
        'Paste Base64 data — with or without the data:image/...;base64, prefix — and the tool detects the image type from its file signature, shows a preview and lets you download the decoded file.',
      steps: ['Paste the Base64 string.', 'Click “Decode”.', 'Check the preview and download the image.'],
      formats: ['PNG, JPEG, GIF, WebP, BMP, ICO and SVG data'],
      limitations: [
        'SVG data is shown as an image (scripts inside SVG never run in an <img> element) and is downloaded as-is.',
        'Input larger than about 70 MB of text is rejected to protect your browser.',
      ],
      faq: [
        { q: 'Is the data sent anywhere?', a: 'No. Decoding is done with JavaScript in your browser.' },
        {
          q: 'Why does it say “not a recognized image”?',
          a: 'The decoded bytes do not start with a known image signature. The text may be truncated, URL-encoded or not an image.',
        },
      ],
    },
    i18n: {
      fr: { title: 'Base64 vers image', short: 'Décodez une chaîne Base64 ou un data URI en image visualisable et téléchargeable.' },
      ar: { title: 'تحويل Base64 إلى صورة', short: 'فك ترميز نص Base64 إلى صورة يمكن عرضها وتنزيلها.' },
    },
  },
  {
    id: 'image-color-picker',
    slug: 'image-color-picker',
    implementation: 'image-color-picker',
    category: 'image-tools',
    icon: 'Pipette',
    title: 'Image Color Picker',
    short: 'Click any pixel of an image to get its HEX, RGB and HSL color values.',
    keywords: ['color picker from image', 'eyedropper', 'get hex from image', 'pixel color'],
    related: ['color-converter', 'css-gradient-generator', 'image-metadata-viewer'],
    addedAt: '2026-09-04',
    fileTool: true,
    content: {
      description:
        'Load a picture, move the cursor over it and click to sample a pixel. The tool shows the color in HEX, RGB and HSL and keeps a history of the colors you picked so you can build a palette.',
      steps: ['Select an image.', 'Click a point on the image (or use the arrow keys to move the picker).', 'Copy the value you need.'],
      formats: ['JPEG', 'PNG', 'WebP', 'GIF', 'SVG'],
      limitations: ['Colors reflect the decoded pixels in sRGB; wide-gamut color profiles may be converted by the browser.'],
      faq: [
        { q: privacy, a: privacyA },
        { q: 'Can I pick colors from my screen?', a: 'This tool works on images. Take a screenshot first, then load it here.' },
      ],
    },
    i18n: {
      fr: { title: 'Pipette de couleur d’image', short: 'Cliquez sur un pixel pour obtenir sa couleur en HEX, RGB et HSL.' },
      ar: { title: 'منتقي الألوان من الصور', short: 'انقر على أي بكسل للحصول على لونه بصيغ HEX وRGB وHSL.' },
    },
  },
  {
    id: 'image-metadata-viewer',
    slug: 'image-metadata-viewer',
    implementation: 'image-metadata-viewer',
    category: 'image-tools',
    icon: 'Info',
    title: 'Image Metadata Viewer',
    short: 'Inspect EXIF data such as camera model, date taken, exposure and GPS location.',
    keywords: ['exif viewer', 'image metadata', 'photo gps location', 'camera info'],
    related: ['image-metadata-remover', 'image-color-picker', 'pdf-info'],
    addedAt: '2026-09-04',
    fileTool: true,
    content: {
      description:
        'See what your photos reveal before you publish them. The viewer reads EXIF, IFD0, GPS and basic file information and highlights sensitive fields like GPS coordinates.',
      steps: ['Select a photo.', 'Read the grouped metadata table.', 'Use the metadata remover if you want to strip it.'],
      formats: ['JPEG', 'TIFF', 'HEIC (metadata only)', 'PNG', 'WebP'],
      limitations: [
        'Only metadata segments supported by the open-source exifr library are read (EXIF, GPS, IFD0, some XMP/IPTC).',
        'Many images shared on social networks have already had their metadata removed, so the table may be empty.',
      ],
      faq: [
        { q: privacy, a: 'No. The file is parsed locally by JavaScript in your browser.' },
        { q: 'Why is there no GPS data?', a: 'The camera may not have recorded it, or the file was stripped by the app that shared it.' },
      ],
    },
    i18n: {
      fr: { title: 'Lecteur de métadonnées d’image', short: 'Consultez les données EXIF : appareil, date, exposition et position GPS.' },
      ar: { title: 'عارض بيانات الصورة الوصفية', short: 'افحص بيانات EXIF مثل طراز الكاميرا وتاريخ الالتقاط وموقع GPS.' },
    },
  },
  {
    id: 'image-metadata-remover',
    slug: 'image-metadata-remover',
    implementation: 'image-metadata-remover',
    category: 'image-tools',
    icon: 'EyeOff',
    title: 'Image Metadata Remover',
    short: 'Strip EXIF data, including GPS location, by re-encoding your photos.',
    keywords: ['remove exif', 'strip metadata', 'remove gps from photo', 'privacy photo'],
    related: ['image-metadata-viewer', 'image-compressor', 'image-converter'],
    addedAt: '2026-09-05',
    fileTool: true,
    content: {
      description:
        'Protect your privacy before posting pictures online. The remover redraws each image on a canvas and exports clean pixels, which drops EXIF, GPS, camera serial numbers and embedded thumbnails.',
      steps: ['Select one or more photos.', 'Click “Remove metadata”.', 'Download the cleaned files (optionally as a ZIP).'],
      formats: ['JPEG', 'PNG', 'WebP'],
      limitations: [
        'Re-encoding JPEG is lossy; a high quality (95%) is used to keep the visual result nearly identical.',
        'Embedded color profiles are converted to sRGB.',
      ],
      faq: [
        { q: privacy, a: privacyA },
        {
          q: 'How can I check it worked?',
          a: 'Open the cleaned file in the Image Metadata Viewer: the EXIF and GPS sections will be empty.',
        },
      ],
    },
    i18n: {
      fr: { title: 'Supprimer les métadonnées', short: 'Effacez les données EXIF, y compris la position GPS, en réencodant vos photos.' },
      ar: { title: 'إزالة بيانات الصورة الوصفية', short: 'احذف بيانات EXIF بما فيها موقع GPS بإعادة ترميز صورك.' },
    },
  },
  {
    id: 'favicon-generator',
    slug: 'favicon-generator',
    implementation: 'favicon-generator',
    category: 'image-tools',
    icon: 'AppWindow',
    title: 'Favicon Generator',
    short: 'Create favicon.ico, PNG icons and an Apple touch icon from one image, packaged as a ZIP.',
    keywords: ['favicon generator', 'ico converter', 'apple touch icon', 'site icon'],
    related: ['image-resizer', 'svg-to-png', 'image-converter'],
    addedAt: '2026-09-05',
    fileTool: true,
    content: {
      description:
        'Upload a square logo and get every common favicon size: a multi-resolution favicon.ico (16, 32, 48 px), PNG icons from 16 to 512 px, an Apple touch icon (180 px) and a ready-to-paste HTML snippet plus web manifest.',
      steps: [
        'Select a square image (512×512 px or larger works best).',
        'Optionally choose a background color for transparent logos.',
        'Click “Generate” and download the ZIP.',
        'Copy the HTML snippet into your site’s <head>.',
      ],
      formats: ['Input: PNG, JPEG, WebP, SVG', 'Output: ICO, PNG, webmanifest'],
      limitations: ['Non-square images are centered and padded to a square.'],
      faq: [
        { q: privacy, a: privacyA },
        { q: 'Which sizes do I really need?', a: 'favicon.ico, a 32 px PNG, a 180 px Apple touch icon and 192/512 px icons for the manifest.' },
      ],
    },
    i18n: {
      fr: { title: 'Générateur de favicon', short: 'Créez favicon.ico, icônes PNG et icône Apple à partir d’une image, en ZIP.' },
      ar: { title: 'مولّد أيقونة الموقع', short: 'أنشئ favicon.ico وأيقونات PNG وأيقونة Apple من صورة واحدة في ملف ZIP.' },
    },
  },
  {
    id: 'svg-to-png',
    slug: 'svg-to-png',
    implementation: 'svg-to-png',
    category: 'image-tools',
    icon: 'FileImage',
    title: 'SVG to PNG',
    short: 'Render SVG files to PNG at any size, safely and with a transparent background.',
    keywords: ['svg to png', 'convert svg', 'rasterize svg', 'svg export'],
    related: ['image-converter', 'favicon-generator', 'image-to-base64'],
    addedAt: '2026-09-06',
    fileTool: true,
    content: {
      description:
        'Convert vector SVG artwork into a PNG at the exact width you need — perfect for app stores, slides or social images. Scripts and external references inside the SVG are blocked before rendering.',
      steps: ['Select an SVG file or paste SVG markup.', 'Set the output width (height follows the aspect ratio) or a scale.', 'Render and download.'],
      formats: ['Input: SVG', 'Output: PNG'],
      limitations: [
        'External fonts and images referenced by URL are not loaded (for safety and privacy); embed them in the SVG instead.',
        'Maximum output size is 8192 px per side.',
      ],
      faq: [
        {
          q: 'Is it safe to open untrusted SVGs?',
          a: 'The SVG is sanitized (scripts, event handlers and foreign objects removed) and rendered as an image, where scripts cannot execute.',
        },
        { q: privacy, a: privacyA },
      ],
    },
    i18n: {
      fr: { title: 'SVG vers PNG', short: 'Convertissez des fichiers SVG en PNG à la taille voulue, en toute sécurité.' },
      ar: { title: 'تحويل SVG إلى PNG', short: 'حوّل ملفات SVG إلى PNG بأي حجم بأمان ومع خلفية شفافة.' },
    },
  },
];
