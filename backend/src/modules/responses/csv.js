const FORMULA_PREFIX = /^\s*[=+\-@]|^[\t\r]/;
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

function toText(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join('; ');
  if (typeof value === 'object') return value.name ?? '';
  return String(value);
}

export function escapeCsvCell(value) {
  let text = toText(value);
  if (FORMULA_PREFIX.test(text) && !PLAIN_NUMBER.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsvRow(values) {
  return `${values.map(escapeCsvCell).join(',')}\r\n`;
}

export const CSV_BOM = '﻿';
