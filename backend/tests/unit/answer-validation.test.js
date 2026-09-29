import { describe, expect, it } from 'vitest';
import { validateAnswers } from '../../src/modules/responses/answer-validation.js';

const field = (type, extra = {}) => ({
  id: `fld_${type.replace('_', '').padEnd(10, 'x').slice(0, 10)}`,
  type,
  label: type,
  required: false,
  options: [],
  validation: {},
  ...extra,
});

const choices = [
  { id: 'opt_aaaaaaaa', label: 'Alpha' },
  { id: 'opt_bbbbbbbb', label: 'Beta' },
];

function check(fieldDef, value) {
  return validateAnswers([fieldDef], { [fieldDef.id]: value });
}

describe('validateAnswers', () => {
  it('requires required fields', () => {
    const result = check(field('short_text', { required: true }), '   ');
    expect(result.errors).toEqual([
      { path: expect.any(String), message: 'This field is required.' },
    ]);
  });

  it('skips empty optional fields', () => {
    const result = check(field('short_text'), '');
    expect(result.errors).toEqual([]);
    expect(result.answers).toEqual({});
  });

  it('trims text and enforces max length', () => {
    const short = field('short_text', { validation: { maxLength: 5 } });
    expect(check(short, '  hi  ').answers[short.id]).toBe('hi');
    expect(check(short, 'too long').errors).toHaveLength(1);
  });

  it('rejects non-string values for text fields', () => {
    expect(check(field('short_text'), { $gt: '' }).errors).toHaveLength(1);
    expect(check(field('long_text'), ['a']).errors).toHaveLength(1);
  });

  it('validates emails and lowercases them', () => {
    const email = field('email');
    expect(check(email, 'Ada@Example.com').answers[email.id]).toBe('ada@example.com');
    expect(check(email, 'not-an-email').errors).toHaveLength(1);
  });

  it('validates numbers with bounds', () => {
    const number = field('number', { validation: { min: 1, max: 10 } });
    expect(check(number, '5').answers[number.id]).toBe(5);
    expect(check(number, 0).errors).toHaveLength(1);
    expect(check(number, 11).errors).toHaveLength(1);
    expect(check(number, 'abc').errors).toHaveLength(1);
  });

  it('validates phone numbers', () => {
    const phone = field('phone');
    expect(check(phone, '+90 (555) 123-4567').errors).toEqual([]);
    expect(check(phone, '12').errors).toHaveLength(1);
    expect(check(phone, 'call me').errors).toHaveLength(1);
  });

  it('only accepts http and https URLs', () => {
    const url = field('url');
    expect(check(url, 'https://example.com/path').errors).toEqual([]);
    expect(check(url, 'javascript:alert(1)').errors).toHaveLength(1);
    expect(check(url, 'example.com').errors).toHaveLength(1);
  });

  it('maps single choice option ids to labels', () => {
    const radio = field('radio', { options: choices });
    expect(check(radio, 'opt_bbbbbbbb').answers[radio.id]).toBe('Beta');
    expect(check(radio, 'opt_cccccccc').errors).toHaveLength(1);
  });

  it('maps checkbox selections to labels', () => {
    const checkbox = field('checkbox', { options: choices });
    expect(check(checkbox, ['opt_aaaaaaaa', 'opt_bbbbbbbb']).answers[checkbox.id]).toEqual([
      'Alpha',
      'Beta',
    ]);
    expect(check(checkbox, ['opt_aaaaaaaa', 'nope']).errors).toHaveLength(1);
  });

  it('validates real calendar dates', () => {
    const date = field('date');
    expect(check(date, '2026-02-28').errors).toEqual([]);
    expect(check(date, '2026-02-30').errors).toHaveLength(1);
    expect(check(date, '28/02/2026').errors).toHaveLength(1);
  });

  it('ignores answers for unknown fields', () => {
    const text = field('short_text');
    const result = validateAnswers([text], { [text.id]: 'ok', fld_unknown000: 'x' });
    expect(Object.keys(result.answers)).toEqual([text.id]);
  });

  it('matches uploaded files to file fields', () => {
    const file = field('file', { required: true });
    expect(validateAnswers([file], {}, []).errors).toHaveLength(1);

    const upload = { fieldname: file.id, originalname: 'a.pdf' };
    expect(validateAnswers([file], {}, [upload]).uploads).toHaveLength(1);

    const stray = { fieldname: 'fld_other00000', originalname: 'a.pdf' };
    expect(validateAnswers([file], {}, [upload, stray]).errors).toHaveLength(1);
  });

  it('builds search text from text answers', () => {
    const text = field('short_text');
    const radio = field('radio', { options: choices });
    const result = validateAnswers([text, radio], {
      [text.id]: 'Hello',
      [radio.id]: 'opt_aaaaaaaa',
    });
    expect(result.searchText).toBe('Hello Alpha');
  });
});
