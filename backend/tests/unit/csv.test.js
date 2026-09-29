import { describe, expect, it } from 'vitest';
import { escapeCsvCell, toCsvRow } from '../../src/modules/responses/csv.js';

describe('escapeCsvCell', () => {
  it('quotes every cell and doubles inner quotes', () => {
    expect(escapeCsvCell('hello')).toBe('"hello"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('a,b\nc')).toBe('"a,b\nc"');
  });

  it.each(['=SUM(A1:A2)', '+1+1', '-2+3', '@cmd', '\tvalue', '\r=1', '  =HYPERLINK("x")'])(
    'neutralizes formula-like value %j',
    (value) => {
      expect(escapeCsvCell(value).startsWith(`"'`)).toBe(true);
    },
  );

  it('keeps plain numbers untouched', () => {
    expect(escapeCsvCell(-42)).toBe('"-42"');
    expect(escapeCsvCell('-3.5')).toBe('"-3.5"');
    expect(escapeCsvCell(10)).toBe('"10"');
  });

  it('formats arrays, files and empty values', () => {
    expect(escapeCsvCell(['A', 'B'])).toBe('"A; B"');
    expect(escapeCsvCell({ name: 'cv.pdf', fileId: 'x' })).toBe('"cv.pdf"');
    expect(escapeCsvCell(undefined)).toBe('""');
    expect(escapeCsvCell(['=1'])).toBe(`"'=1"`);
  });
});

describe('toCsvRow', () => {
  it('joins cells with commas and ends with CRLF', () => {
    expect(toCsvRow(['a', 1])).toBe('"a","1"\r\n');
  });
});
