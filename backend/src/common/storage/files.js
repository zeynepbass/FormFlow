import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';

const root = path.resolve(env.UPLOAD_DIR);

function resolveKey(key) {
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep)) throw new Error('Invalid storage key');
  return target;
}

export async function saveFile(key, buffer) {
  const target = resolveKey(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer, { flag: 'wx' });
}

export async function openFile(key) {
  const target = resolveKey(key);
  const { size } = await stat(target);
  return { stream: createReadStream(target), size };
}

export async function removeFile(key) {
  await rm(resolveKey(key), { force: true });
}

export async function removeFolder(prefix) {
  await rm(resolveKey(prefix), { recursive: true, force: true });
}
