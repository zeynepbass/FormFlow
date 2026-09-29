import * as z from 'zod/mini';
import { MAX_FILE_SIZE, TEXT_LIMITS } from '@/types/field-types';

const REQUIRED = 'This field is required.';
const PHONE_PATTERN = /^\+?[0-9\s().-]{6,24}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt'];

const emptyToUndefined = (value) =>
  value === '' ||
  value === null ||
  value === false ||
  (typeof value === 'string' && value.trim() === '')
    ? undefined
    : value;

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) return [value];
  return [];
}

function firstFile(value) {
  if (typeof FileList !== 'undefined' && value instanceof FileList) return value[0];
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

const trimmed = () => z.string().check(z.trim());

function valueSchema(field) {
  const { min, max, maxLength } = field.validation ?? {};

  switch (field.type) {
    case 'short_text':
    case 'long_text': {
      const limit = Math.min(maxLength ?? Infinity, TEXT_LIMITS[field.type]);
      return trimmed().check(z.maxLength(limit, `Use at most ${limit} characters.`));
    }
    case 'email':
      return z.pipe(trimmed(), z.email({ error: 'Enter a valid email address.' }));
    case 'number': {
      const checks = [z.refine(Number.isFinite, 'Enter a number.')];
      if (min !== undefined)
        checks.push(z.refine((value) => value >= min, `Enter ${min} or more.`));
      if (max !== undefined)
        checks.push(z.refine((value) => value <= max, `Enter ${max} or less.`));
      return z.coerce.number({ error: 'Enter a number.' }).check(...checks);
    }
    case 'phone':
      return trimmed().check(
        z.refine((value) => {
          const digits = value.replace(/\D/g, '').length;
          return PHONE_PATTERN.test(value) && digits >= 6 && digits <= 15;
        }, 'Enter a valid phone number.'),
      );
    case 'url':
      return z.pipe(
        trimmed(),
        z.url({
          protocol: /^https?$/,
          error: 'Enter a full URL starting with http:// or https://.',
        }),
      );
    case 'select':
    case 'radio':
      return z.enum(
        field.options.map((option) => option.id),
        { error: 'Choose one of the options.' },
      );
    case 'date':
      return z.string().check(z.regex(DATE_PATTERN, 'Enter a valid date.'));
    case 'file':
      return z.instanceof(File).check(
        z.refine((file) => file.size <= MAX_FILE_SIZE, 'Files must be 5 MB or smaller.'),
        z.refine(
          (file) => FILE_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase()),
          'Upload a PDF, PNG, JPEG, WebP or TXT file.',
        ),
      );
    default:
      return z.unknown();
  }
}

function fieldSchema(field) {
  if (field.type === 'checkbox') {
    let schema = z.array(z.enum(field.options.map((option) => option.id)));
    if (field.required) schema = schema.check(z.minLength(1, 'Select at least one option.'));
    return z.pipe(z.transform(toArray), schema);
  }

  const base = valueSchema(field);
  const normalize = field.type === 'file' ? firstFile : emptyToUndefined;
  const present = z.custom((value) => value !== undefined, REQUIRED);
  return z.pipe(z.transform(normalize), field.required ? z.pipe(present, base) : z.optional(base));
}

export function buildAnswerSchema(fields) {
  return z.object(Object.fromEntries(fields.map((field) => [field.id, fieldSchema(field)])));
}
