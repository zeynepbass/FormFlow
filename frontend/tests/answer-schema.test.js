import { describe, expect, it } from 'vitest';
import { buildAnswerSchema } from '@/features/public-form/answer-schema';

const fields = [
  {
    id: 'fld_name000000',
    type: 'short_text',
    label: 'Name',
    required: true,
    options: [],
    validation: { maxLength: 10 },
  },
  {
    id: 'fld_mail000000',
    type: 'email',
    label: 'Email',
    required: false,
    options: [],
    validation: {},
  },
  {
    id: 'fld_age0000000',
    type: 'number',
    label: 'Age',
    required: false,
    options: [],
    validation: { min: 18, max: 99 },
  },
  {
    id: 'fld_site000000',
    type: 'url',
    label: 'Site',
    required: false,
    options: [],
    validation: {},
  },
  {
    id: 'fld_pick000000',
    type: 'radio',
    label: 'Pick',
    required: true,
    options: [{ id: 'opt_aaaaaaaa', label: 'A' }],
    validation: {},
  },
  {
    id: 'fld_many000000',
    type: 'checkbox',
    label: 'Many',
    required: true,
    options: [
      { id: 'opt_bbbbbbbb', label: 'B' },
      { id: 'opt_cccccccc', label: 'C' },
    ],
    validation: {},
  },
];

const schema = buildAnswerSchema(fields);
const valid = {
  fld_name000000: 'Ada',
  fld_mail000000: '',
  fld_age0000000: '',
  fld_site000000: '',
  fld_pick000000: 'opt_aaaaaaaa',
  fld_many000000: ['opt_bbbbbbbb'],
};

function errorsFor(values) {
  const result = schema.safeParse({ ...valid, ...values });
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe('buildAnswerSchema', () => {
  it('accepts a valid submission and drops empty optional answers', () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data.fld_mail000000).toBeUndefined();
  });

  it('requires required fields with a clear message', () => {
    expect(
      errorsFor({ fld_name000000: '  ', fld_pick000000: null, fld_many000000: false }),
    ).toEqual({
      fld_name000000: 'This field is required.',
      fld_pick000000: 'This field is required.',
      fld_many000000: 'Select at least one option.',
    });
  });

  it('applies per-type rules', () => {
    expect(errorsFor({ fld_name000000: 'far too long a name' }).fld_name000000).toMatch(
      /at most 10/,
    );
    expect(errorsFor({ fld_mail000000: 'nope' }).fld_mail000000).toBe(
      'Enter a valid email address.',
    );
    expect(errorsFor({ fld_age0000000: '12' }).fld_age0000000).toBe('Enter 18 or more.');
    expect(errorsFor({ fld_site000000: 'javascript:alert(1)' }).fld_site000000).toMatch(/http/);
    expect(errorsFor({ fld_pick000000: 'opt_zzzzzzzz' }).fld_pick000000).toBe(
      'Choose one of the options.',
    );
  });

  it('normalises a single checkbox value into an array', () => {
    const result = schema.safeParse({ ...valid, fld_many000000: 'opt_cccccccc' });
    expect(result.data.fld_many000000).toEqual(['opt_cccccccc']);
  });
});
