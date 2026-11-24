// Copies PDF.js runtime assets (wasm decoders, standard fonts, CMaps) into public/pdfjs
// so the site never depends on a third-party CDN. Runs automatically before dev/build.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = dirname(require.resolve('pdfjs-dist/package.json'));
const dest = join(process.cwd(), 'public', 'pdfjs');
mkdirSync(dest, { recursive: true });
for (const dir of ['wasm', 'standard_fonts', 'cmaps']) {
  const src = join(root, dir);
  if (existsSync(src)) cpSync(src, join(dest, dir), { recursive: true });
}
console.log('[pdfjs] assets copied to public/pdfjs');
