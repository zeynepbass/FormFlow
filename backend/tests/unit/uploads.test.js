import { describe, expect, it } from 'vitest';
import { inspectUpload, sanitizeFilename } from '../../src/modules/responses/uploads.js';
import { PDF_BYTES, PNG_BYTES } from '../fixtures.js';

const upload = (originalname, buffer) => ({ originalname, buffer, size: buffer.length });

describe('sanitizeFilename', () => {
  it('strips paths and unsafe characters', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('C:\\Users\\me\\cv.pdf')).toBe('cv.pdf');
    expect(sanitizeFilename('<script>.png')).toBe('_script_.png');
    expect(sanitizeFilename('bad\u0000name.txt')).toBe('badname.txt');
  });

  it('falls back to a default name', () => {
    expect(sanitizeFilename('...')).toBe('file');
    expect(sanitizeFilename(undefined)).toBe('file');
  });

  it('keeps the extension when truncating', () => {
    const name = sanitizeFilename(`${'a'.repeat(300)}.pdf`);
    expect(name).toHaveLength(120);
    expect(name.endsWith('.pdf')).toBe(true);
  });
});

describe('inspectUpload', () => {
  it('accepts files whose content matches the extension', async () => {
    await expect(inspectUpload(upload('photo.png', PNG_BYTES))).resolves.toMatchObject({
      mimeType: 'image/png',
    });
    await expect(inspectUpload(upload('doc.pdf', PDF_BYTES))).resolves.toMatchObject({
      mimeType: 'application/pdf',
    });
    await expect(inspectUpload(upload('notes.txt', Buffer.from('hello')))).resolves.toMatchObject({
      mimeType: 'text/plain',
    });
  });

  it('rejects disallowed extensions', async () => {
    await expect(inspectUpload(upload('run.exe', PDF_BYTES))).rejects.toMatchObject({
      status: 415,
    });
    await expect(
      inspectUpload(upload('page.html', Buffer.from('<h1>x</h1>'))),
    ).rejects.toMatchObject({ status: 415 });
  });

  it('rejects content that does not match the extension', async () => {
    await expect(inspectUpload(upload('photo.png', PDF_BYTES))).rejects.toMatchObject({
      status: 415,
    });
    await expect(inspectUpload(upload('notes.txt', PNG_BYTES))).rejects.toMatchObject({
      status: 415,
    });
    await expect(
      inspectUpload(upload('image.jpg', Buffer.from('<svg onload=alert(1)>'))),
    ).rejects.toMatchObject({ status: 415 });
  });
});
