import { randomId } from './tokens.js';

export const RESERVED_SLUGS = new Set(['yeni', 'admin', 'api', 'giris', 'kayit', 'panel']);

export function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
}

export function createSlug(title) {
  const base = slugify(title) || 'form';
  return `${base}-${randomId(4)}`;
}
