import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { publicApi } from '@/lib/api/server';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug) {
  return typeof slug === 'string' && slug.length <= 60 && SLUG_PATTERN.test(slug);
}

export async function getPublicForm(slug) {
  'use cache';
  cacheLife('hours');
  cacheTag(`form:${slug}`);

  const result = await publicApi(`/public/forms/${slug}`);
  return result?.data ?? null;
}
