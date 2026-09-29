import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';

const TAG_PATTERN = /^form:[a-z0-9-]{1,60}$/;

function isAuthorized(provided) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || typeof provided !== 'string') return false;
  const digest = (value) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

export async function POST(request) {
  if (!isAuthorized(request.headers.get('x-revalidate-secret'))) {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'Forbidden.' } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag) => TAG_PATTERN.test(tag)) : [];
  for (const tag of tags.slice(0, 10)) revalidateTag(tag, { expire: 0 });

  return Response.json({ data: { revalidated: tags.length } });
}
