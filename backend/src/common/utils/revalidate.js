import { env, isTest } from '../../config/env.js';
import { logger } from '../../config/logger.js';

function publicFormTag(slug) {
  return `form:${slug}`;
}

export async function revalidatePublicForm(...slugs) {
  if (isTest || !env.REVALIDATE_SECRET) return;

  const tags = [...new Set(slugs.filter(Boolean))].map(publicFormTag);
  try {
    const response = await fetch(new URL('/revalidate', env.APP_URL), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': env.REVALIDATE_SECRET,
      },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) logger.warn({ status: response.status }, 'Revalidation request failed');
  } catch (error) {
    logger.warn({ err: error.message }, 'Revalidation request failed');
  }
}
