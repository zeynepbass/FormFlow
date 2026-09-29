import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import { unsupportedMediaType } from '../../common/errors/app-error.js';

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_UPLOADS = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  txt: 'text/plain',
};

export const parseMultipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 3, fields: 2, fieldSize: 200 * 1024, parts: 5 },
}).any();

export function sanitizeFilename(name) {
  const base = String(name ?? '')
    .split(/[/\\]/)
    .pop()
    .normalize('NFKC')
    .replace(/\p{Cc}/gu, '')
    .replace(/[^\p{L}\p{N} ._()-]/gu, '_')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '');

  if (!base) return 'file';
  if (base.length <= 120) return base;

  const extension = path.extname(base).slice(0, 10);
  return base.slice(0, 120 - extension.length) + extension;
}

function isPlainText(buffer) {
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

export async function inspectUpload(file) {
  const name = sanitizeFilename(file.originalname);
  const extension = path.extname(name).slice(1).toLowerCase();
  const expected = ALLOWED_UPLOADS[extension];
  if (!expected) throw unsupportedMediaType('PDF, PNG, JPEG, WebP veya TXT dosyası yükle.');

  const detected = await fileTypeFromBuffer(file.buffer);

  if (expected === 'text/plain') {
    if (detected || !isPlainText(file.buffer)) {
      throw unsupportedMediaType('Dosya içeriği uzantısıyla uyuşmuyor.');
    }
  } else if (detected?.mime !== expected) {
    throw unsupportedMediaType('Dosya içeriği uzantısıyla uyuşmuyor.');
  }

  return { name, mimeType: expected, size: file.size };
}
