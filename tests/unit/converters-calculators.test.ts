import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  convertUnit,
  csvToJson,
  detectDelimiter,
  fromCelsius,
  jsonToCsv,
  parseColor,
  parseCsv,
  rgbToHex,
  rgbToHsl,
  toBytes,
  toCelsius,
} from '../../src/features/converter-tools/logic';
import {
  age,
  applyDiscounts,
  aspectRatio,
  businessDays,
  dateDifference,
  parseDate,
  percentChange,
  percentOf,
  solveRatio,
  vat,
  whatPercent,
} from '../../src/features/calculator-tools/logic';

describe('CSV', () => {
  it('parses quoted fields with commas, quotes and newlines', () => {
    expect(parseCsv('a,"b,c","d ""e""","f\ng"\n1,2,3,4', ',')).toEqual([
      ['a', 'b,c', 'd "e"', 'f\ng'],
      ['1', '2', '3', '4'],
    ]);
  });
  it('detects delimiters', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t');
  });
  it('converts to typed JSON with deduplicated headers', () => {
    expect(csvToJson('name,age,name,ok\nAl,30,X,true', { header: true, parseTypes: true })).toEqual([{ name: 'Al', age: 30, name_2: 'X', ok: true }]);
  });
  it('throws on unterminated quotes', () => {
    expect(() => parseCsv('"abc', ',')).toThrow(/Unterminated/);
  });
  it('JSON → CSV flattens objects and protects formulas', () => {
    const csv = jsonToCsv([{ a: { b: 1 }, c: '=SUM(A1)', d: 'x,y' }], { delimiter: ',', protectFormulas: true, bom: false, eol: '\n' });
    expect(csv).toBe(`a.b,c,d\n1,'=SUM(A1),"x,y"`);
  });
});

describe('units & temperature & sizes', () => {
  it('converts units exactly', () => {
    expect(convertUnit(1, 'length', 'mi', 'km')).toBeCloseTo(1.609344, 9);
    expect(convertUnit(1, 'weight', 'kg', 'lb')).toBeCloseTo(2.20462262, 6);
    expect(convertUnit(100, 'speed', 'kmh', 'ms')).toBeCloseTo(27.7778, 3);
  });
  it('converts temperatures', () => {
    expect(fromCelsius(100, 'F')).toBe(212);
    expect(toCelsius(32, 'F')).toBe(0);
    expect(fromCelsius(0, 'K')).toBe(273.15);
  });
  it('file sizes', () => {
    expect(toBytes(1, 'GiB')).toBe(1073741824);
    expect(toBytes(1, 'TB') / toBytes(1, 'GiB')).toBeCloseTo(931.32, 2);
  });
});

describe('colors', () => {
  it('parses formats', () => {
    expect(parseColor('#fff')).toMatchObject({ r: 255, g: 255, b: 255 });
    expect(parseColor('rgb(30, 144, 255)')).toMatchObject({ r: 30, g: 144, b: 255 });
    expect(rgbToHex(parseColor('hsl(0, 100%, 50%)')!)).toBe('#ff0000');
    expect(parseColor('rgb(300,0,0)')).toBeNull();
  });
  it('converts to HSL and computes WCAG contrast', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 5);
  });
});

describe('calculators', () => {
  it('percentages', () => {
    expect(percentOf(15, 200)).toBe(30);
    expect(whatPercent(30, 120)).toBe(25);
    expect(whatPercent(1, 0)).toBeNull();
    expect(percentChange(80, 100)).toBe(25);
    expect(percentChange(0, 5)).toBeNull();
  });
  it('stacked discounts', () => {
    expect(applyDiscounts(100, [{ type: 'percent', value: 30 }, { type: 'percent', value: 10 }])).toEqual({ final: 63, saved: 37, effectivePercent: 37 });
  });
  it('VAT add and remove', () => {
    expect(vat(100, 20, 'add')).toEqual({ net: 100, tax: 20, gross: 120 });
    expect(vat(120, 20, 'remove')).toEqual({ net: 100, tax: 20, gross: 120 });
  });
  it('age with month borrowing and leap-day birthdays', () => {
    const a = age(parseDate('2000-01-31')!, parseDate('2024-03-01')!)!;
    expect([a.years, a.months, a.days]).toEqual([24, 1, 1]);
    const leap = age(parseDate('2004-02-29')!, parseDate('2025-02-27')!)!;
    expect(leap.nextBirthdayInDays).toBe(1);
    expect(age(parseDate('2030-01-01')!, parseDate('2020-01-01')!)).toBeNull();
  });
  it('rejects invalid dates', () => {
    expect(parseDate('2024-02-30')).toBeNull();
  });
  it('business days and date differences', () => {
    // Mon 2024-01-01 .. Mon 2024-01-08 exclusive end → 5 business days
    expect(businessDays(parseDate('2024-01-01')!, parseDate('2024-01-08')!, false)).toBe(5);
    const d = dateDifference(parseDate('2024-01-01')!, parseDate('2024-12-31')!, true);
    expect(d.totalDays).toBe(366);
  });
  it('aspect ratios', () => {
    expect(aspectRatio(1920, 1080)).toMatchObject({ x: 16, y: 9 });
    expect(aspectRatio(1366, 768)?.closest).toBe('16:9');
    expect(solveRatio(16, 9, 1280, null)).toEqual({ width: 1280, height: 720 });
  });
});
