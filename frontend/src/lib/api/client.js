import { ApiError } from './api-error';

export async function api(path, { method = 'GET', body, signal } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  let response;

  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body && !isFormData ? { 'content-type': 'application/json' } : undefined,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Check your connection and try again.',
    });
  }

  if (response.status === 204) return { data: null };

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload?.error);
  return payload;
}

export function applyFieldErrors(error, setError, fieldNames) {
  let applied = false;
  for (const detail of error.details ?? []) {
    if (fieldNames.includes(detail.path)) {
      setError(detail.path, { type: 'server', message: detail.message });
      applied = true;
    }
  }
  return applied;
}
