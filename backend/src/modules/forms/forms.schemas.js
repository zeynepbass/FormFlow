import { z } from 'zod';
import { RESERVED_SLUGS } from '../../common/utils/slug.js';
import {
  CHOICE_TYPES,
  FIELD_ID_PATTERN,
  FIELD_TYPES,
  FORM_LIMITS,
  FORM_STATUSES,
  OPTION_ID_PATTERN,
  TEXT_LIMITS,
} from './field-types.js';

const optionSchema = z
  .object({
    id: z.string().regex(OPTION_ID_PATTERN),
    label: z.string().trim().min(1, 'Options need a label.').max(200),
  })
  .strict();

const validationSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    maxLength: z.number().int().min(1).max(TEXT_LIMITS.long_text).optional(),
  })
  .strict()
  .refine((value) => value.min === undefined || value.max === undefined || value.min <= value.max, {
    message: 'Minimum must be less than or equal to maximum.',
  });

export const fieldSchema = z
  .object({
    id: z.string().regex(FIELD_ID_PATTERN),
    type: z.enum(FIELD_TYPES),
    label: z.string().trim().min(1, 'Every field needs a label.').max(200),
    description: z.string().trim().max(500).default(''),
    placeholder: z.string().trim().max(150).default(''),
    required: z.boolean().default(false),
    options: z.array(optionSchema).max(FORM_LIMITS.options).default([]),
    validation: validationSchema.default({}),
  })
  .strict()
  .transform((field) => (CHOICE_TYPES.has(field.type) ? field : { ...field, options: [] }));

const fieldsSchema = z
  .array(fieldSchema)
  .max(FORM_LIMITS.fields, `A form can have at most ${FORM_LIMITS.fields} fields.`)
  .superRefine((fields, ctx) => {
    const ids = new Set();
    fields.forEach((field, index) => {
      if (ids.has(field.id)) {
        ctx.addIssue({ code: 'custom', path: [index, 'id'], message: 'Duplicate field id.' });
      }
      ids.add(field.id);

      const optionIds = new Set(field.options.map((option) => option.id));
      if (optionIds.size !== field.options.length) {
        ctx.addIssue({ code: 'custom', path: [index, 'options'], message: 'Duplicate option id.' });
      }
    });

    const fileFields = fields.filter((field) => field.type === 'file').length;
    if (fileFields > FORM_LIMITS.fileFields) {
      ctx.addIssue({
        code: 'custom',
        message: `A form can have at most ${FORM_LIMITS.fileFields} file upload fields.`,
      });
    }
  });

const title = z.string().trim().min(1, 'Give your form a title.').max(120);
const description = z.string().trim().max(1000);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use at least 3 characters.')
  .max(60, 'Use at most 60 characters.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single dashes.')
  .refine((value) => !RESERVED_SLUGS.has(value), 'This address is reserved.');

const settingsSchema = z
  .object({
    submitLabel: z.string().trim().min(1).max(40),
    successMessage: z.string().trim().min(1).max(500),
    allowIndexing: z.boolean(),
  })
  .strict();

export const createFormSchema = z.object({ title, description: description.default('') }).strict();

export const updateFormSchema = z
  .object({
    version: z.number().int().min(1),
    title: title.optional(),
    description: description.optional(),
    slug: slugSchema.optional(),
    fields: fieldsSchema.optional(),
    settings: settingsSchema.partial().optional(),
  })
  .strict();

export const listFormsQuerySchema = z.object({
  status: z.enum(FORM_STATUSES).optional(),
});

export const DEFAULT_SETTINGS = {
  submitLabel: 'Submit',
  successMessage: 'Thanks! Your response has been recorded.',
  allowIndexing: false,
};
