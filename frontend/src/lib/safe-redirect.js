export function safeRedirectPath(value, fallback = '/dashboard') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  if (value.includes('\\')) return fallback;
  return value;
}
