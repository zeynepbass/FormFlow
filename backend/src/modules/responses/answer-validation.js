import { z } from 'zod';
import { TEXT_LIMITS } from '../forms/field-types.js';

const emailSchema = z.email();
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]{6,24}$/;
const SEARCH_TEXT_LIMIT = 4000;

function isEmpty(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isValidDate(value) {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function validateText(field, raw) {
  if (typeof raw !== 'string') return { error: 'Metin gir.' };
  const value = raw.trim();
  const limit = Math.min(field.validation?.maxLength ?? Infinity, TEXT_LIMITS[field.type]);
  if (value.length > limit) return { error: `En fazla ${limit} karakter kullan.` };
  return { value };
}

const validators = {
  short_text: validateText,
  long_text: validateText,

  email(field, raw) {
    if (typeof raw !== 'string' || raw.length > 254)
      return { error: 'Geçerli bir e-posta adresi gir.' };
    const value = raw.trim().toLowerCase();
    return emailSchema.safeParse(value).success
      ? { value }
      : { error: 'Geçerli bir e-posta adresi gir.' };
  },

  number(field, raw) {
    const value = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
    if (typeof value !== 'number' || !Number.isFinite(value)) return { error: 'Bir sayı gir.' };
    const { min, max } = field.validation ?? {};
    if (min !== undefined && value < min) return { error: `${min} veya daha büyük bir değer gir.` };
    if (max !== undefined && value > max) return { error: `${max} veya daha küçük bir değer gir.` };
    return { value };
  },

  phone(field, raw) {
    if (typeof raw !== 'string') return { error: 'Geçerli bir telefon numarası gir.' };
    const value = raw.trim();
    const digits = value.replace(/\D/g, '').length;
    if (!PHONE_PATTERN.test(value) || digits < 6 || digits > 15) {
      return { error: 'Geçerli bir telefon numarası gir.' };
    }
    return { value };
  },

  url(field, raw) {
    if (typeof raw !== 'string' || raw.length > 2048) return { error: 'Geçerli bir adres gir.' };
    const value = raw.trim();
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol');
      return { value };
    } catch {
      return { error: 'http:// veya https:// ile başlayan tam bir adres gir.' };
    }
  },

  select: validateSingleChoice,
  radio: validateSingleChoice,

  checkbox(field, raw) {
    const ids = Array.isArray(raw) ? raw : [raw];
    if (ids.length > field.options.length || ids.some((id) => typeof id !== 'string')) {
      return { error: 'Mevcut seçeneklerden seç.' };
    }
    const selected = field.options.filter((option) => ids.includes(option.id));
    if (selected.length !== new Set(ids).size) return { error: 'Mevcut seçeneklerden seç.' };
    return { value: selected.map((option) => option.label) };
  },

  date(field, raw) {
    if (typeof raw !== 'string' || !isValidDate(raw)) return { error: 'Geçerli bir tarih gir.' };
    return { value: raw };
  },
};

function validateSingleChoice(field, raw) {
  const option = typeof raw === 'string' ? field.options.find((item) => item.id === raw) : null;
  if (!option) return { error: 'Seçeneklerden birini seç.' };
  return { value: option.label };
}

export function validateAnswers(fields, rawAnswers, files = []) {
  const answers = {};
  const errors = [];
  const uploads = [];
  const searchParts = [];
  const input = rawAnswers && typeof rawAnswers === 'object' ? rawAnswers : {};

  const filesByField = new Map();
  for (const file of files) {
    const field = fields.find((item) => item.id === file.fieldname && item.type === 'file');
    if (!field || filesByField.has(field.id)) {
      errors.push({ path: file.fieldname, message: 'Beklenmeyen dosya.' });
      continue;
    }
    filesByField.set(field.id, file);
  }

  for (const field of fields) {
    if (field.type === 'file') {
      const file = filesByField.get(field.id);
      if (file) uploads.push({ field, file });
      else if (field.required) errors.push({ path: field.id, message: 'Bir dosya ekle.' });
      continue;
    }

    const raw = Object.hasOwn(input, field.id) ? input[field.id] : undefined;
    if (isEmpty(raw)) {
      if (field.required) errors.push({ path: field.id, message: 'Bu alan zorunludur.' });
      continue;
    }

    const result = validators[field.type](field, raw);
    if (result.error) {
      errors.push({ path: field.id, message: result.error });
      continue;
    }

    answers[field.id] = result.value;
    if (field.type !== 'number' && field.type !== 'date') {
      searchParts.push(Array.isArray(result.value) ? result.value.join(' ') : result.value);
    }
  }

  return {
    answers,
    uploads,
    errors,
    searchText: searchParts.join(' ').slice(0, SEARCH_TEXT_LIMIT),
  };
}
