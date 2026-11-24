import { describe, expect, it } from 'vitest';
import {
  base64DecodeUtf8,
  base64EncodeUtf8,
  decodeEntities,
  decodeJwt,
  encodeEntities,
  formatJson,
  formatXml,
  locateJsonError,
  parseTimestamp,
  urlDecode,
  urlEncode,
} from '../../src/features/developer-tools/logic';
import { executeRegex } from '../../src/lib/regex/execute';

describe('JSON', () => {
  it('formats and sorts', () => {
    const r = formatJson('{"b":1,"a":[1,2]}', 2, true);
    expect('output' in r && r.output).toBe('{\n  "a": [\n    1,\n    2\n  ],\n  "b": 1\n}');
  });
  it('reports line/column for errors', () => {
    const e = locateJsonError('{\n  "a": 1,\n}');
    expect(e).not.toBeNull();
    expect(e!.line).toBe(3);
    expect(e!.message).toMatch(/trailing comma/i);
  });
  it('rejects single quotes and comments', () => {
    expect(locateJsonError("{'a':1}")!.message).toMatch(/double/);
    expect(locateJsonError('// x\n{}')!.message).toMatch(/comment/i);
  });
  it('accepts valid JSON', () => {
    expect(locateJsonError('{"a":[1,2.5e3,true,null,"\\u00e9"]}')).toBeNull();
  });
});

describe('XML', () => {
  it('pretty prints nested elements', () => {
    expect(formatXml('<a><b>x</b><c/></a>')).toBe('<a>\n  <b>x</b>\n  <c/>\n</a>');
  });
  it('minifies', () => {
    expect(formatXml('<a>\n  <b>x</b>\n</a>', '  ', true)).toBe('<a><b>x</b></a>');
  });
});

describe('URL & Base64', () => {
  it('encodes components', () => {
    expect(urlEncode('a b&c/d', 'component')).toBe('a%20b%26c%2Fd');
    expect(urlEncode('https://x.com/a b', 'full')).toBe('https://x.com/a%20b');
  });
  it('decodes and reports malformed input', () => {
    expect(urlDecode('a+b%C3%A9')).toBe('a bé');
    expect(() => urlDecode('%E0%A4%A')).toThrow(/malformed/);
  });
  it('round-trips UTF-8 Base64 and Base64URL', () => {
    const s = 'Café 👍 مرحبا';
    expect(base64DecodeUtf8(base64EncodeUtf8(s))).toBe(s);
    const u = base64EncodeUtf8(s, true);
    expect(u).not.toMatch(/[+/=]/);
    expect(base64DecodeUtf8(u)).toBe(s);
  });
  it('rejects invalid Base64', () => {
    expect(() => base64DecodeUtf8('abc$')).toThrow();
  });
});

describe('HTML entities', () => {
  it('encodes and decodes', () => {
    expect(encodeEntities('<a href="x">é</a>', 'named')).toBe('&lt;a href=&quot;x&quot;&gt;&eacute;&lt;/a&gt;');
    expect(decodeEntities('&lt;b&gt; &eacute; &#233; &#xE9; &unknown;')).toBe('<b> é é é &unknown;');
  });
});

describe('JWT', () => {
  const b64u = (o: unknown) => base64EncodeUtf8(JSON.stringify(o), true);
  it('decodes header, payload and expiry without verifying', () => {
    const token = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: '1', exp: 1000 })}.sig`;
    const d = decodeJwt(token, 2_000_000);
    expect(d.header.alg).toBe('HS256');
    expect(d.payload.sub).toBe('1');
    expect(d.expired).toBe(true);
  });
  it('rejects malformed tokens and JWE', () => {
    expect(() => decodeJwt('a.b')).toThrow(/three parts/);
    expect(() => decodeJwt('a.b.c.d.e')).toThrow(/encrypted/);
  });
});

describe('timestamps', () => {
  it('detects units', () => {
    expect(parseTimestamp('1700000000')).toEqual({ ms: 1_700_000_000_000, unit: 'seconds' });
    expect(parseTimestamp('1700000000000')?.unit).toBe('milliseconds');
    expect(parseTimestamp('abc')).toBeNull();
  });
});

describe('regex execution', () => {
  it('returns matches with groups', () => {
    const r = executeRegex({ mode: 'match', pattern: '(\\w)(\\d)', flags: 'g', input: 'a1 b2' });
    expect(r.matches!.map((m) => m.text)).toEqual(['a1', 'b2']);
    expect(r.matches![1].groups).toEqual(['b', '2']);
  });
  it('handles empty matches without looping forever', () => {
    const r = executeRegex({ mode: 'match', pattern: 'x*', flags: 'g', input: 'abc' });
    expect(r.matches!.length).toBe(4);
  });
  it('replaces with group references and counts', () => {
    const r = executeRegex({ mode: 'replace', pattern: '(?<w>\\w+)@(\\w+)', flags: 'g', input: 'a@b c@d', replacement: '$2:$<w>' });
    expect(r).toEqual({ output: 'b:a d:c', count: 2 });
  });
  it('rejects invalid patterns and flags', () => {
    expect(() => executeRegex({ mode: 'match', pattern: '(', flags: '', input: '' })).toThrow(/Invalid regular expression/);
    expect(() => executeRegex({ mode: 'match', pattern: 'a', flags: 'uv', input: '' })).toThrow();
  });
});
