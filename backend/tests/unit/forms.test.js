import { describe, expect, it } from 'vitest';
import { createSlug, slugify } from '../../src/common/utils/slug.js';
import {
  fieldSchema,
  slugSchema,
  updateFormSchema,
} from '../../src/modules/forms/forms.schemas.js';
import { getPublishProblems } from '../../src/modules/forms/forms.service.js';

describe('slugs', () => {
  it('creates lowercase, url-safe slugs', () => {
    expect(slugify('  Müşteri Geri Bildirim Formu! ')).toBe('musteri-geri-bildirim-formu');
    expect(createSlug('Contact')).toMatch(/^contact-[a-z0-9]{4}$/);
    expect(createSlug('!!!')).toMatch(/^form-[a-z0-9]{4}$/);
  });

  it('validates custom slugs', () => {
    expect(slugSchema.safeParse('my-form').success).toBe(true);
    expect(slugSchema.safeParse('My Form').success).toBe(false);
    expect(slugSchema.safeParse('a--b').success).toBe(false);
    expect(slugSchema.safeParse('admin').success).toBe(false);
  });
});

describe('fieldSchema', () => {
  const base = { id: 'fld_abcdefghij', type: 'short_text', label: 'Name' };

  it('applies defaults', () => {
    expect(fieldSchema.parse(base)).toEqual({
      ...base,
      description: '',
      placeholder: '',
      required: false,
      options: [],
      validation: {},
    });
  });

  it('drops options on non-choice fields', () => {
    const parsed = fieldSchema.parse({ ...base, options: [{ id: 'opt_aaaaaaaa', label: 'A' }] });
    expect(parsed.options).toEqual([]);
  });

  it('rejects unknown keys, types and malformed ids', () => {
    expect(fieldSchema.safeParse({ ...base, onclick: 'x' }).success).toBe(false);
    expect(fieldSchema.safeParse({ ...base, type: 'html' }).success).toBe(false);
    expect(fieldSchema.safeParse({ ...base, id: '$where' }).success).toBe(false);
  });

  it('rejects inverted numeric bounds', () => {
    const result = fieldSchema.safeParse({
      ...base,
      type: 'number',
      validation: { min: 5, max: 1 },
    });
    expect(result.success).toBe(false);
  });
});

describe('updateFormSchema', () => {
  it('rejects protected properties', () => {
    for (const key of ['ownerId', 'status', 'responseCount', 'createdAt']) {
      expect(updateFormSchema.safeParse({ version: 1, [key]: 'x' }).success).toBe(false);
    }
  });

  it('rejects duplicate field ids and too many file fields', () => {
    const field = { id: 'fld_abcdefghij', type: 'short_text', label: 'A' };
    expect(updateFormSchema.safeParse({ version: 1, fields: [field, field] }).success).toBe(false);

    const files = ['a', 'b', 'c', 'd'].map((c) => ({
      id: `fld_${c.repeat(10)}`,
      type: 'file',
      label: c,
    }));
    expect(updateFormSchema.safeParse({ version: 1, fields: files }).success).toBe(false);
  });
});

describe('getPublishProblems', () => {
  it('requires fields and options for choice fields', () => {
    expect(getPublishProblems({ title: 'A', fields: [] })).toHaveLength(1);
    expect(
      getPublishProblems({
        title: 'A',
        fields: [{ id: 'fld_abcdefghij', type: 'select', label: 'Pick', options: [] }],
      }),
    ).toEqual([expect.objectContaining({ path: 'fields.0.options' })]);
  });
});
