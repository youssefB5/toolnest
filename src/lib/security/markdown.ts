import { marked } from 'marked';

/**
 * Server-safe Markdown renderer for admin-managed content (pages, homepage text).
 * Raw HTML in the source is ESCAPED (never passed through), and links are
 * restricted to safe protocols. This runs on the server (Workers) without a DOM,
 * so we do not rely on DOMPurify here: we never emit user-provided HTML at all.
 */
const ALLOWED_INLINE_TAGS = new Set(['kbd']);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(href: string): string | null {
  const s = (href || '').trim();
  if (/^(https?:|mailto:)/i.test(s) || s.startsWith('/') || s.startsWith('#')) {
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(s) || s.startsWith('//')) return null;
    return s;
  }
  return null;
}

export function renderSafeMarkdown(src: string): string {
  const renderer = new marked.Renderer();
  renderer.html = ({ text }) => {
    // allow a tiny whitelist of harmless inline tags without attributes, e.g. <kbd>/</kbd>
    const m = text.match(/^<\/?([a-z]+)>$/i);
    if (m && ALLOWED_INLINE_TAGS.has(m[1].toLowerCase())) return text.toLowerCase();
    return escapeHtml(text);
  };
  renderer.link = function ({ href, title, tokens }) {
    const url = safeUrl(href);
    const inner = this.parser.parseInline(tokens);
    if (!url) return inner;
    const ext = /^https?:/i.test(url);
    const t = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(url)}"${t}${ext ? ' rel="noopener noreferrer nofollow" target="_blank"' : ''}>${inner}</a>`;
  };
  renderer.image = ({ href, title, text }) => {
    const url = safeUrl(href);
    if (!url) return escapeHtml(text || '');
    const t = title ? ` title="${escapeHtml(title)}"` : '';
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text || '')}"${t} loading="lazy" decoding="async">`;
  };
  return marked.parse(String(src ?? ''), { renderer, async: false, gfm: true, breaks: false }) as string;
}

export { escapeHtml };
