import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError } from './api-error';

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

export async function serverApi(path) {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${API_URL}/api${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (response.status === 401) redirect('/login');

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload?.error);
  return payload;
}

export async function publicApi(path) {
  const response = await fetch(`${API_URL}/api${path}`);
  if (response.status === 404) return null;

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload?.error);
  return payload;
}
