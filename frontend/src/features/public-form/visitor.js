import { randomId } from '@/lib/ids';

const STORAGE_KEY = 'formflow:visitor';
let fallbackId;

export function getVisitorId() {
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = randomId('v', 23);
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    fallbackId ??= randomId('v', 23);
    return fallbackId;
  }
}

export function sendFormEvent(slug, type) {
  const url = `/api/public/forms/${encodeURIComponent(slug)}/events`;
  const body = JSON.stringify({ type, visitorId: getVisitorId() });

  if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return;
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
