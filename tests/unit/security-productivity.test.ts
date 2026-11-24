import { describe, expect, it } from 'vitest';
import { entropyBits, generatePassword, randomIndex, uuidV4, uuidV7, digest, toHex } from '../../src/features/security-tools/logic';
import { gradientCss, lorem, qrPayload } from '../../src/features/productivity-tools/logic';

describe('UUID', () => {
  it('v4 and v7 have correct version/variant', () => {
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const v7 = uuidV7(0x0123456789ab);
    expect(v7).toMatch(/^01234567-89ab-7[0-9a-f]{3}-[89ab]/);
  });
  it('v7 is time-ordered', () => {
    expect(uuidV7(1000) < uuidV7(2000)).toBe(true);
  });
});

describe('password generator', () => {
  const base = { length: 24, lower: true, upper: true, digits: true, symbols: false, excludeAmbiguous: true };
  it('respects length and includes each selected set', () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword(base);
      expect(p).toHaveLength(24);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/\d/);
      expect(p).not.toMatch(/[O0oIl1|]/);
      expect(p).not.toMatch(/[!@#$%^&*]/);
    }
  });
  it('clamps length and requires a set', () => {
    expect(generatePassword({ ...base, length: 1 })).toHaveLength(4);
    expect(() => generatePassword({ ...base, lower: false, upper: false, digits: false })).toThrow();
  });
  it('randomIndex is roughly uniform', () => {
    const counts = new Array(6).fill(0);
    for (let i = 0; i < 6000; i++) counts[randomIndex(6)]++;
    for (const c of counts) expect(c).toBeGreaterThan(800);
  });
  it('computes entropy', () => {
    expect(entropyBits({ length: 10, lower: false, upper: false, digits: true, symbols: false, excludeAmbiguous: false })).toBe(33);
  });
});

describe('hash', () => {
  it('computes SHA-256 test vector', async () => {
    expect(toHex(await digest('SHA-256', new TextEncoder().encode('abc')))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('QR payloads', () => {
  it('builds Wi-Fi and URL payloads with escaping', () => {
    expect(qrPayload('wifi', { ssid: 'My;Net', password: 'p:w', security: 'WPA' })).toBe('WIFI:T:WPA;S:My\\;Net;P:p\\:w;;');
    expect(qrPayload('url', { url: 'example.com' })).toBe('https://example.com');
    expect(qrPayload('email', { email: 'a@b.c', subject: 'Hi there' })).toBe('mailto:a@b.c?subject=Hi%20there');
  });
});

describe('gradient & lorem', () => {
  it('sorts stops', () => {
    expect(gradientCss('linear', 90, [{ color: '#fff', pos: 100 }, { color: '#000', pos: 0 }])).toBe('linear-gradient(90deg, #000 0%, #fff 100%)');
  });
  it('generates the requested amount', () => {
    expect(lorem('words', 7, { startClassic: true, html: false }).split(' ')).toHaveLength(7);
    expect(lorem('paragraphs', 3, { startClassic: true, html: true }).match(/<p>/g)).toHaveLength(3);
  });
});
