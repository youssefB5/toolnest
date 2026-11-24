/**
 * Returns true for hrefs that are safe to render in an <a> or <img>:
 * same-site paths, https/http URLs and mailto:. Rejects javascript:, data:, vbscript:,
 * protocol-relative URLs and anything containing control characters.
 */
export function isSafeHref(href: string): boolean {
  if (typeof href !== 'string') return false;
  const s = href.trim();
  if (!s || s.length > 2048) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(s)) return false;
  if (s.startsWith('//')) return false;
  if (s.startsWith('/') || s.startsWith('#')) return true;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:';
  } catch {
    return false;
  }
}

/** True for absolute links pointing to another origin. */
export function isExternal(href: string, siteOrigin: string): boolean {
  try {
    return new URL(href, siteOrigin).origin !== new URL(siteOrigin).origin;
  } catch {
    return false;
  }
}

/** Make a filename safe for download: strips path separators, control and reserved characters. */
export function safeFilename(name: string, fallback = 'file'): string {
  const base = String(name ?? '')
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, '_')
    .replace(/^\.+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
  return base || fallback;
}

/** Replace a file's extension. */
export function withExtension(name: string, ext: string): string {
  const clean = safeFilename(name);
  const dot = clean.lastIndexOf('.');
  const stem = dot > 0 ? clean.slice(0, dot) : clean;
  return `${stem}.${ext.replace(/^\./, '')}`;
}

/** Append a suffix before the extension: photo.jpg -> photo-compressed.jpg */
export function withSuffix(name: string, suffix: string, ext?: string): string {
  const clean = safeFilename(name);
  const dot = clean.lastIndexOf('.');
  const stem = dot > 0 ? clean.slice(0, dot) : clean;
  const e = ext ?? (dot > 0 ? clean.slice(dot + 1) : '');
  return e ? `${stem}-${suffix}.${e}` : `${stem}-${suffix}`;
}
