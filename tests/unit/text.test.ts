import { describe, expect, it } from 'vitest';
import {
  addLineNumbers,
  charStats,
  convertCase,
  diffText,
  removeDuplicateLines,
  replacePlain,
  slugify,
  sortLines,
  wordStats,
} from '../../src/features/text-tools/logic';

describe('wordStats', () => {
  it('counts words, sentences and paragraphs', () => {
    const s = wordStats("Hello world. It's a state-of-the-art tool!\n\nSecond paragraph here.");
    expect(s.words).toBe(9);
    expect(s.sentences).toBe(3);
    expect(s.paragraphs).toBe(2);
  });
  it('handles empty input', () => {
    const s = wordStats('');
    expect(s.words).toBe(0);
    expect(s.sentences).toBe(0);
    expect(s.lines).toBe(0);
  });
  it('counts non-Latin words', () => {
    expect(wordStats('مرحبا بالعالم').words).toBe(2);
    expect(wordStats('Ça marche très bien').words).toBe(4);
  });
});

describe('charStats', () => {
  it('distinguishes graphemes, UTF-16 units and bytes', () => {
    const s = charStats('é👍');
    expect(s.characters).toBe(2);
    expect(s.utf16Units).toBe(3);
    expect(s.bytes).toBe(6);
  });
});

describe('convertCase', () => {
  it('converts identifiers', () => {
    expect(convertCase('hello world example', 'camel')).toBe('helloWorldExample');
    expect(convertCase('helloWorld example', 'snake')).toBe('hello_world_example');
    expect(convertCase('Hello World', 'kebab')).toBe('hello-world');
    expect(convertCase('XMLHttpRequest', 'snake')).toBe('xml_http_request');
    expect(convertCase('my var', 'constant')).toBe('MY_VAR');
    expect(convertCase('my var', 'pascal')).toBe('MyVar');
  });
  it('title case keeps small words lowercase', () => {
    expect(convertCase('the lord of the rings', 'title')).toBe('The Lord of the Rings');
  });
  it('sentence case', () => {
    expect(convertCase('HELLO. how ARE you?', 'sentence')).toBe('Hello. How are you?');
  });
});

describe('removeDuplicateLines', () => {
  it('keeps first occurrences and reports removals', () => {
    const r = removeDuplicateLines('a\nB\nb\na\n\nc', { ignoreCase: true, trim: true, removeEmpty: true });
    expect(r.text).toBe('a\nB\nc');
    expect(r.removed).toBe(3);
  });
});

describe('sortLines', () => {
  it('sorts naturally', () => {
    expect(sortLines('item10\nitem2\nitem1', 'natural')).toBe('item1\nitem2\nitem10');
  });
  it('sorts by length and reverses', () => {
    expect(sortLines('ccc\na\nbb', 'length')).toBe('a\nbb\nccc');
    expect(sortLines('1\n2\n3', 'reverse')).toBe('3\n2\n1');
  });
  it('shuffle keeps the same multiset', () => {
    const out = sortLines('a\nb\nc\nd\ne', 'shuffle').split('\n').sort();
    expect(out).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

describe('replacePlain', () => {
  it('replaces literally, escaping regex characters', () => {
    expect(replacePlain('a.b a.b', 'a.b', 'X', { caseSensitive: true, wholeWord: false })).toEqual({ text: 'X X', count: 2 });
  });
  it('respects whole words', () => {
    expect(replacePlain('cat category cat', 'cat', 'dog', { caseSensitive: true, wholeWord: true }).text).toBe('dog category dog');
  });
});

describe('slugify', () => {
  it('transliterates accents and strips punctuation', () => {
    expect(slugify('Crème Brûlée: 10 Easy Tips!', { separator: '-', lowercase: true, asciiOnly: true, maxLength: 0 })).toBe('creme-brulee-10-easy-tips');
  });
  it('honors max length at word boundary', () => {
    expect(slugify('one two three four', { separator: '-', lowercase: true, asciiOnly: true, maxLength: 12 })).toBe('one-two');
  });
});

describe('addLineNumbers', () => {
  it('pads and skips empty lines', () => {
    expect(addLineNumbers('a\n\nb', { start: 9, step: 1, pad: true, separator: '. ', skipEmpty: true })).toBe('09. a\n\n10. b');
  });
});

describe('diffText', () => {
  it('detects inserted and deleted lines', () => {
    const r = diffText('a\nb\nc', 'a\nc\nd', 'line');
    expect(r.stats).toEqual({ added: 1, removed: 1, unchanged: 2 });
  });
});
