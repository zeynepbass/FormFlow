import { once } from 'node:events';
import { ObjectId } from 'mongodb';
import { collection } from '../../database/client.js';
import { badRequest, notFound } from '../../common/errors/app-error.js';
import { openFile, removeFile, saveFile } from '../../common/storage/files.js';
import { randomId } from '../../common/utils/tokens.js';
import { recordSubmission } from '../analytics/analytics.service.js';
import { validateAnswers } from './answer-validation.js';
import { CSV_BOM, toCsvRow } from './csv.js';
import { inspectUpload } from './uploads.js';

const responses = () => collection('responses');

export function toResponseDto(response) {
  const answers = {};
  for (const [fieldId, value] of Object.entries(response.answers)) {
    answers[fieldId] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? { fileId: value.fileId, name: value.name, size: value.size, mimeType: value.mimeType }
        : value;
  }
  return { id: response._id.toString(), answers, createdAt: response.createdAt };
}

function encodeCursor(response) {
  return Buffer.from(
    JSON.stringify([response.createdAt.getTime(), response._id.toString()]),
  ).toString('base64url');
}

function decodeCursor(cursor) {
  try {
    const [time, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!Number.isFinite(time) || !ObjectId.isValid(id)) throw new Error('cursor');
    return { createdAt: new Date(time), id: new ObjectId(id) };
  } catch {
    throw badRequest('Geçersiz sayfa bilgisi.');
  }
}

function buildFilter(formId, { q, from, to }) {
  const filter = { formId };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  if (q) filter.$text = { $search: q };
  return filter;
}

export async function listResponses(form, query) {
  const filter = buildFilter(form._id, query);
  const forward = query.dir === 'next';

  let pageFilter = filter;
  if (query.cursor) {
    const { createdAt, id } = decodeCursor(query.cursor);
    const op = forward ? '$lt' : '$gt';
    pageFilter = {
      ...filter,
      $and: [{ $or: [{ createdAt: { [op]: createdAt } }, { createdAt, _id: { [op]: id } }] }],
    };
  }

  const direction = forward ? -1 : 1;
  const [documents, total] = await Promise.all([
    responses()
      .find(pageFilter, { projection: { searchText: 0 } })
      .sort({ createdAt: direction, _id: direction })
      .limit(query.limit + 1)
      .toArray(),
    responses().countDocuments(filter),
  ]);

  const hasMore = documents.length > query.limit;
  const page = documents.slice(0, query.limit);
  if (!forward) page.reverse();

  const first = page[0];
  const last = page.at(-1);
  const hasNewer = forward ? Boolean(query.cursor) : hasMore;
  const hasOlder = forward ? hasMore : true;

  return {
    items: page.map(toResponseDto),
    meta: {
      total,
      nextCursor: last && hasOlder ? encodeCursor(last) : null,
      prevCursor: first && hasNewer ? encodeCursor(first) : null,
    },
  };
}

export async function getResponse(form, responseId) {
  const response = await responses().findOne(
    { _id: responseId, formId: form._id, ownerId: form.ownerId },
    { projection: { searchText: 0 } },
  );
  if (!response) throw notFound('Yanıt bulunamadı.');
  return response;
}

function fileKeys(response) {
  return Object.values(response.answers)
    .filter((value) => value && typeof value === 'object' && value.key)
    .map((value) => value.key);
}

export async function deleteResponse(form, responseId) {
  const response = await responses().findOneAndDelete({
    _id: responseId,
    formId: form._id,
    ownerId: form.ownerId,
  });
  if (!response) throw notFound('Yanıt bulunamadı.');

  await collection('forms').updateOne({ _id: form._id }, { $inc: { responseCount: -1 } });
  await Promise.all(fileKeys(response).map(removeFile));
}

export async function openResponseFile(form, responseId, fileId) {
  const response = await getResponse(form, responseId);
  const file = Object.values(response.answers).find(
    (value) => value && typeof value === 'object' && value.fileId === fileId,
  );
  if (!file) throw notFound('Dosya bulunamadı.');

  try {
    const { stream, size } = await openFile(file.key);
    return { stream, size, name: file.name, mimeType: file.mimeType };
  } catch {
    throw notFound('Dosya bulunamadı.');
  }
}

export async function submitResponse(form, { answers: rawAnswers, visitorId }, files) {
  const { answers, uploads, errors, searchText } = validateAnswers(form.fields, rawAnswers, files);
  if (errors.length > 0) throw badRequest('Bazı yanıtların düzeltilmesi gerekiyor.', errors);

  const inspected = await Promise.all(
    uploads.map(async ({ field, file }) => ({ field, file, meta: await inspectUpload(file) })),
  );

  const savedKeys = [];
  try {
    for (const { field, file, meta } of inspected) {
      const fileId = randomId(16);
      const key = `${form._id}/${fileId}`;
      await saveFile(key, file.buffer);
      savedKeys.push(key);
      answers[field.id] = { fileId, key, ...meta };
    }

    const response = {
      formId: form._id,
      ownerId: form.ownerId,
      answers,
      searchText,
      createdAt: new Date(),
    };
    const { insertedId } = await responses().insertOne(response);
    await Promise.all([
      collection('forms').updateOne({ _id: form._id }, { $inc: { responseCount: 1 } }),
      recordSubmission(form._id, visitorId),
    ]);
    return insertedId;
  } catch (error) {
    await Promise.all(savedKeys.map(removeFile));
    throw error;
  }
}

export async function exportResponses(form, filters, res) {
  const cursor = responses()
    .find(buildFilter(form._id, filters), { projection: { searchText: 0 } })
    .sort({ createdAt: -1, _id: -1 });

  const header = ['Gönderim zamanı', 'Yanıt ID', ...form.fields.map((field) => field.label)];
  res.write(CSV_BOM + toCsvRow(header));

  try {
    for await (const response of cursor) {
      const row = [
        response.createdAt.toISOString(),
        response._id.toString(),
        ...form.fields.map((field) => response.answers[field.id]),
      ];
      if (res.destroyed) break;
      if (!res.write(toCsvRow(row))) {
        await Promise.race([once(res, 'drain'), once(res, 'close')]);
      }
    }
  } finally {
    await cursor.close();
  }
  res.end();
}
