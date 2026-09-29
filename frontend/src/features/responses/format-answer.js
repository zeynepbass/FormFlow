import { formatBytes } from '@/lib/format';

export function isFileAnswer(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && 'fileId' in value;
}

export function formatAnswer(value) {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (isFileAnswer(value)) return `${value.name} (${formatBytes(value.size)})`;
  return String(value);
}
