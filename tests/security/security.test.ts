import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderSafeMarkdown } from '../../src/lib/security/markdown';
import { isSafeHref } from '../../src/lib/security/url';
import { jsonLdString } from '../../src/lib/seo/meta';
import { assertNotServiceRole } from '../../src/lib/supabase/config';
import { validateImportedTool } from '../../src/components/admin/validation';
import { IMPLEMENTATION_KEYS } from '../../src/types/tool';

const root = join(__dirname, '..', '..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('XSS protection in admin-managed Markdown', () => {
  const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '[click](javascript:alert(1))',
    '![x](javascript:alert(1))',
    '<a href="javascript:alert(1)">x</a>',
    '<iframe src="https://evil.example"></iframe>',
    '[x](//evil.example)',
    '<svg onload=alert(1)>',
  ];
  for (const p of payloads) {
    it(`neutralizes ${p}`, () => {
      const html = renderSafeMarkdown(p);
      expect(html).not.toMatch(/<script|<iframe|<svg|<img[^>]+onerror|href="javascript:|src="javascript:|href="\/\/evil/i);
    });
  }
  it('keeps safe formatting and links', () => {
    const html = renderSafeMarkdown('**bold** [ok](https://example.com) [in](/about/) <kbd>/</kbd>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('<kbd>/</kbd>');
  });
});

describe('URL safety', () => {
  it('allows only safe protocols', () => {
    for (const ok of ['/a', '#x', 'https://a.b', 'http://a.b', 'mailto:a@b.c']) expect(isSafeHref(ok)).toBe(true);
    for (const bad of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'data:text/html,x', 'vbscript:x', '//evil.com', 'java\nscript:x', '']) expect(isSafeHref(bad)).toBe(false);
  });
});

describe('JSON-LD serialization', () => {
  it('cannot break out of the script element', () => {
    expect(jsonLdString({ a: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});

describe('secrets', () => {
  it('refuses service_role and secret keys', () => {
    const payload = btoa(JSON.stringify({ role: 'service_role' })).replace(/=+$/, '');
    expect(() => assertNotServiceRole(`x.${payload}.y`)).toThrow(/service_role/);
    expect(() => assertNotServiceRole('sb_secret_abc')).toThrow();
    const anon = btoa(JSON.stringify({ role: 'anon' })).replace(/=+$/, '');
    expect(() => assertNotServiceRole(`x.${anon}.y`)).not.toThrow();
  });
  it('no service_role key or secrets are referenced in source code', () => {
    for (const f of walk(join(root, 'src'))) {
      const c = readFileSync(f, 'utf8');
      expect(c, f).not.toMatch(/SUPABASE_SERVICE_ROLE|service_role_key|sb_secret_[A-Za-z0-9]/);
      expect(c, f).not.toMatch(/eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/); // embedded JWTs
      expect(c, f).not.toMatch(/\beval\(|new Function\(/);
    }
  });
  it('.env files are git-ignored', () => {
    const gi = readFileSync(join(root, '.gitignore'), 'utf8');
    expect(gi).toMatch(/^\.env$/m);
    expect(gi).toMatch(/^\.dev\.vars$/m);
  });
});

describe('database migrations (static checks)', () => {
  const sql = walk(join(root, 'supabase', 'migrations')).map((f) => readFileSync(f, 'utf8')).join('\n');
  const tables = [...sql.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]);
  it('enables RLS on every table', () => {
    expect(tables.length).toBeGreaterThanOrEqual(11);
    for (const t of tables) expect(sql, t).toMatch(new RegExp(`alter table public\\.${t}\\s+enable row level security`));
  });
  it('every SECURITY DEFINER function pins search_path', () => {
    const fns = sql.split(/create or replace function/i).slice(1);
    for (const f of fns) if (/security definer/i.test(f.slice(0, 400))) expect(f.slice(0, 400)).toMatch(/set search_path = ''/);
  });
  it('admin_users and logs have no direct write policies', () => {
    expect(sql).not.toMatch(/on public\.admin_users for (insert|update|delete)/);
    expect(sql).not.toMatch(/on public\.admin_activity_logs for (insert|update|delete)/);
  });
  it('implementation keys in SQL match the registry', () => {
    const block = /implementation_key text not null check \(implementation_key in \(([\s\S]*?)\)\)/.exec(sql)![1];
    const keys = [...block.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]).sort();
    expect(keys).toEqual([...IMPLEMENTATION_KEYS].sort());
  });
});

describe('import validation', () => {
  const ok = { id: 'x-tool', slug: 'x-tool', implementation_key: 'word-counter', category_id: 'text-tools', title: 'X', short_description: 'Y' };
  it('accepts valid records', () => {
    expect(validateImportedTool(ok, IMPLEMENTATION_KEYS, ['text-tools'])).toBeNull();
  });
  it('rejects unknown implementations, bad slugs, wrong types and oversized fields', () => {
    expect(validateImportedTool({ ...ok, implementation_key: 'eval-js' }, IMPLEMENTATION_KEYS, ['text-tools'])).toMatch(/unknown implementation/);
    expect(validateImportedTool({ ...ok, slug: '../x' }, IMPLEMENTATION_KEYS, ['text-tools'])).toMatch(/slug/);
    expect(validateImportedTool({ ...ok, is_enabled: 'yes' }, IMPLEMENTATION_KEYS, ['text-tools'])).toMatch(/boolean/);
    expect(validateImportedTool({ ...ok, title: 'x'.repeat(101) }, IMPLEMENTATION_KEYS, ['text-tools'])).toMatch(/too long/);
    expect(validateImportedTool({ ...ok, category_id: 'nope' }, IMPLEMENTATION_KEYS, ['text-tools'])).toMatch(/category/);
    expect(validateImportedTool([], IMPLEMENTATION_KEYS, ['text-tools'])).toMatch(/object/);
  });
});
