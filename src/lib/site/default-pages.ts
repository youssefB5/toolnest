import type { PageType } from './types';

/**
 * Built-in page templates used when the database has no published version.
 * They describe the platform's actual behavior. The site owner MUST review
 * them (company name, jurisdiction, contact) before launch — see docs/ADMIN_GUIDE.md.
 */
export interface DefaultPage {
  slug: string;
  type: PageType;
  title: { en: string; fr: string };
  body: { en: string; fr: string };
}

const UPDATED = '2026-11-24';
export const DEFAULT_PAGES_UPDATED_AT = UPDATED;

export const DEFAULT_PAGES: DefaultPage[] = [
  {
    slug: 'about',
    type: 'info',
    title: { en: 'About {brand}', fr: 'À propos de {brand}' },
    body: {
      en: `{brand} is a collection of free online tools for images, PDF documents, text, development and everyday calculations.

## Our principles

- **Free and without registration.** Every tool can be used immediately, without an account.
- **Privacy by design.** Tools run inside your browser. Files you select are processed on your device and are not uploaded to our servers during normal processing.
- **Honest tools.** We explain what each tool does, what it cannot do and when a result may not be what you expect (for example, when a PDF cannot be compressed further).
- **Accessible and fast.** Pages are lightweight, keyboard-friendly and designed for phones as well as desktops.

## How it works

Processing relies on standard web technologies — the Canvas API for images, Web Workers for heavy tasks, and open-source libraries such as pdf-lib and PDF.js for documents. Our servers only deliver the web pages and code.`,
      fr: `{brand} est une collection d’outils en ligne gratuits pour les images, les documents PDF, le texte, le développement et les calculs du quotidien.

## Nos principes

- **Gratuit et sans inscription.** Chaque outil s’utilise immédiatement, sans compte.
- **Confidentialité dès la conception.** Les outils s’exécutent dans votre navigateur. Les fichiers que vous sélectionnez sont traités sur votre appareil et ne sont pas envoyés sur nos serveurs lors d’un traitement normal.
- **Des outils honnêtes.** Nous expliquons ce que fait chaque outil, ses limites et les cas où le résultat peut surprendre (par exemple un PDF impossible à compresser davantage).
- **Accessible et rapide.** Pages légères, utilisables au clavier, conçues pour mobile comme pour ordinateur.

## Fonctionnement

Le traitement repose sur des technologies web standard : l’API Canvas pour les images, les Web Workers pour les tâches lourdes, et des bibliothèques open source comme pdf-lib et PDF.js pour les documents. Nos serveurs ne font que livrer les pages et le code.`,
    },
  },
  {
    slug: 'contact',
    type: 'info',
    title: { en: 'Contact', fr: 'Contact' },
    body: {
      en: `We welcome bug reports, tool suggestions and accessibility feedback.

{contact}

When reporting a problem, please include the tool name, your browser and device, and a description of what happened. **Never send us files containing personal or confidential information.**`,
      fr: `Nous accueillons volontiers les signalements de bugs, suggestions d’outils et retours sur l’accessibilité.

{contact}

Pour signaler un problème, indiquez le nom de l’outil, votre navigateur et votre appareil, ainsi qu’une description de ce qui s’est passé. **Ne nous envoyez jamais de fichiers contenant des informations personnelles ou confidentielles.**`,
    },
  },
  {
    slug: 'privacy-policy',
    type: 'legal',
    title: { en: 'Privacy Policy', fr: 'Politique de confidentialité' },
    body: {
      en: `_Last updated: ${UPDATED}_

This policy explains what information {brand} processes when you use the website.

## Files and text you process

Tools run locally in your web browser. **Files are processed locally in your browser whenever supported. They are not uploaded to our server during normal processing.** Text you type into tools is not transmitted to us. We do not store, view or analyze your files.

## Data stored on your device

To make the site convenient, we store a few items in your browser’s local storage: your theme and language preference, favorite tools, recently used tools and recent searches. This data never leaves your device and you can clear it at any time from your browser settings.

## Server logs

Our hosting provider (Cloudflare) may process technical data such as IP address, user agent and requested URL to deliver and protect the website. This data is handled under the provider’s own privacy policy.

## Analytics and advertising

No analytics or advertising scripts are active unless this policy states otherwise. If advertising (for example Google AdSense) is enabled in the future, a consent banner will ask for your permission before any non-essential cookies are set, and this policy will be updated.

## Administrators

Only site administrators have accounts. Their email address and activity on the administration panel are stored by our database provider (Supabase) to secure the service.

## Your rights

Depending on where you live (for example under the GDPR), you may have rights to access, correct or delete personal data. Because we do not collect personal data from visitors, there is usually nothing to access. Contact us via the contact page with any question.`,
      fr: `_Dernière mise à jour : ${UPDATED}_

Cette politique explique quelles informations {brand} traite lorsque vous utilisez le site.

## Fichiers et textes traités

Les outils s’exécutent localement dans votre navigateur. **Les fichiers sont traités localement dans votre navigateur lorsque c’est possible. Ils ne sont pas envoyés à notre serveur lors d’un traitement normal.** Le texte saisi dans les outils ne nous est pas transmis. Nous ne stockons, ne consultons ni n’analysons vos fichiers.

## Données stockées sur votre appareil

Pour votre confort, nous enregistrons quelques éléments dans le stockage local de votre navigateur : thème, langue, outils favoris, outils récents et recherches récentes. Ces données ne quittent jamais votre appareil et vous pouvez les effacer à tout moment.

## Journaux serveur

Notre hébergeur (Cloudflare) peut traiter des données techniques (adresse IP, navigateur, URL demandée) pour livrer et protéger le site, conformément à sa propre politique de confidentialité.

## Mesure d’audience et publicité

Aucun script de mesure d’audience ni de publicité n’est actif, sauf mention contraire dans cette politique. Si la publicité (par exemple Google AdSense) est activée à l’avenir, un bandeau vous demandera votre consentement avant tout cookie non essentiel, et cette politique sera mise à jour.

## Administrateurs

Seuls les administrateurs du site disposent d’un compte. Leur adresse e-mail et leur activité dans le panneau d’administration sont stockées par notre fournisseur de base de données (Supabase) pour sécuriser le service.

## Vos droits

Selon votre lieu de résidence (par exemple au titre du RGPD), vous pouvez disposer de droits d’accès, de rectification ou d’effacement. Comme nous ne collectons pas de données personnelles des visiteurs, il n’y a généralement rien à consulter. Contactez-nous via la page contact pour toute question.`,
    },
  },
  {
    slug: 'terms',
    type: 'legal',
    title: { en: 'Terms of Service', fr: 'Conditions d’utilisation' },
    body: {
      en: `_Last updated: ${UPDATED}_

By using {brand} you agree to these terms.

## Use of the tools

The tools are provided free of charge for lawful personal and professional use. You are responsible for the files and content you process and for having the right to process them. Do not use the tools to infringe copyright or to circumvent protections of documents you are not authorized to modify.

## No warranty

The tools are provided “as is”, without warranty of any kind. Results (for example calculations, conversions or compressed files) should be checked before being relied on for important decisions. Keep a copy of your original files.

## Limitation of liability

To the maximum extent permitted by law, {brand} is not liable for any loss of data, profit or other damages resulting from the use of the website.

## Changes

We may modify or discontinue tools and update these terms at any time. Continued use after changes constitutes acceptance.`,
      fr: `_Dernière mise à jour : ${UPDATED}_

En utilisant {brand}, vous acceptez les présentes conditions.

## Utilisation des outils

Les outils sont fournis gratuitement pour un usage personnel et professionnel licite. Vous êtes responsable des fichiers et contenus traités et devez disposer des droits nécessaires. N’utilisez pas les outils pour enfreindre le droit d’auteur ni pour contourner les protections de documents que vous n’êtes pas autorisé à modifier.

## Absence de garantie

Les outils sont fournis « en l’état », sans garantie d’aucune sorte. Les résultats (calculs, conversions, fichiers compressés…) doivent être vérifiés avant toute décision importante. Conservez une copie de vos fichiers originaux.

## Limitation de responsabilité

Dans toute la mesure permise par la loi, {brand} ne saurait être tenu responsable d’une perte de données, de profits ou de tout autre dommage résultant de l’utilisation du site.

## Modifications

Nous pouvons modifier ou retirer des outils et mettre à jour ces conditions à tout moment. Poursuivre l’utilisation après modification vaut acceptation.`,
    },
  },
  {
    slug: 'cookie-policy',
    type: 'legal',
    title: { en: 'Cookie Policy', fr: 'Politique relative aux cookies' },
    body: {
      en: `_Last updated: ${UPDATED}_

## Current use

{brand} does not set advertising or analytics cookies. We use your browser’s **local storage** (not cookies) only for preferences: theme, language, favorites, recently used tools and recent searches. These are strictly functional and stay on your device.

Administrators who sign in receive an authentication session stored in local storage by Supabase Auth.

## Future advertising

If advertising is enabled, third-party providers such as Google may use cookies to serve and measure ads. Those cookies will only be set after you give consent through a banner, and you will be able to withdraw consent at any time.`,
      fr: `_Dernière mise à jour : ${UPDATED}_

## Utilisation actuelle

{brand} ne dépose aucun cookie publicitaire ou de mesure d’audience. Nous utilisons le **stockage local** de votre navigateur (et non des cookies) uniquement pour vos préférences : thème, langue, favoris, outils récents et recherches récentes. Ces données sont strictement fonctionnelles et restent sur votre appareil.

Les administrateurs qui se connectent reçoivent une session d’authentification stockée localement par Supabase Auth.

## Publicité future

Si la publicité est activée, des prestataires tiers comme Google pourront utiliser des cookies pour diffuser et mesurer les annonces. Ces cookies ne seront déposés qu’après votre consentement via un bandeau, que vous pourrez retirer à tout moment.`,
    },
  },
  {
    slug: 'disclaimer',
    type: 'legal',
    title: { en: 'Disclaimer', fr: 'Avertissement' },
    body: {
      en: `The information and tools on {brand} are provided for general informational and productivity purposes only.

- **Calculators** (VAT, discounts, percentages, dates) give mathematical results. They are not financial, tax or legal advice. Tax rates vary by country and product.
- **Security tools** (password and hash generators, JWT decoder) follow best practices but you remain responsible for how you store and use secrets. The JWT decoder does **not** verify signatures.
- **File tools** modify copies of your files. Always keep your originals.

Links to third-party websites are provided for convenience; we are not responsible for their content.`,
      fr: `Les informations et outils de {brand} sont fournis à titre informatif et pratique uniquement.

- **Les calculatrices** (TVA, remises, pourcentages, dates) donnent des résultats mathématiques. Elles ne constituent pas un conseil financier, fiscal ou juridique. Les taux de TVA varient selon les pays et les produits.
- **Les outils de sécurité** (générateurs de mots de passe et d’empreintes, décodeur JWT) suivent les bonnes pratiques, mais vous restez responsable du stockage et de l’usage de vos secrets. Le décodeur JWT ne vérifie **pas** les signatures.
- **Les outils fichiers** modifient des copies de vos fichiers. Conservez toujours vos originaux.

Les liens vers des sites tiers sont fournis pour votre commodité ; nous ne sommes pas responsables de leur contenu.`,
    },
  },
  {
    slug: 'help',
    type: 'help',
    title: { en: 'Help', fr: 'Aide' },
    body: {
      en: `## Using a tool

1. Find a tool with the search box (press <kbd>/</kbd> to focus it) or browse the categories.
2. Select or drop your files, or type your text.
3. Adjust the options and run the tool. Results appear below with download or copy buttons.

## Troubleshooting

- **Nothing happens / the page is slow:** very large files require a lot of memory. Try a smaller file or close other tabs.
- **“Unsupported format”:** the file’s content does not match a supported format, even if its extension looks right.
- **Encrypted PDF:** password-protected PDFs cannot be modified. Remove the protection in an authorized application first.
- **Downloads do not start on iOS:** long-press the download button or allow downloads in Safari settings.

## Favorites and history

Click the star on any tool to add it to your favorites. Favorites, recent tools and searches are stored only in your browser.`,
      fr: `## Utiliser un outil

1. Trouvez un outil grâce à la recherche (touche <kbd>/</kbd> pour y accéder) ou parcourez les catégories.
2. Sélectionnez ou déposez vos fichiers, ou saisissez votre texte.
3. Réglez les options et lancez l’outil. Les résultats s’affichent avec des boutons de téléchargement ou de copie.

## Dépannage

- **Rien ne se passe / la page est lente :** les très gros fichiers demandent beaucoup de mémoire. Essayez un fichier plus petit ou fermez d’autres onglets.
- **« Format non pris en charge » :** le contenu du fichier ne correspond pas à un format pris en charge, même si l’extension semble correcte.
- **PDF chiffré :** les PDF protégés par mot de passe ne peuvent pas être modifiés. Retirez la protection dans une application autorisée.
- **Le téléchargement ne démarre pas sur iOS :** appuyez longuement sur le bouton ou autorisez les téléchargements dans Safari.

## Favoris et historique

Cliquez sur l’étoile d’un outil pour l’ajouter à vos favoris. Favoris, outils récents et recherches sont stockés uniquement dans votre navigateur.`,
    },
  },
];
