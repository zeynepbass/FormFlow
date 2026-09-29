import { collection } from '../../database/client.js';
import { AppError, conflict, notFound } from '../../common/errors/app-error.js';
import { removeFolder } from '../../common/storage/files.js';
import { revalidatePublicForm } from '../../common/utils/revalidate.js';
import { createSlug } from '../../common/utils/slug.js';
import { withId } from '../../common/utils/serialize.js';
import { CHOICE_TYPES, STATUS_LABELS, STATUS_TRANSITIONS } from './field-types.js';
import { DEFAULT_SETTINGS } from './forms.schemas.js';

const forms = () => collection('forms');

export function toFormDto(form) {
  const { ownerId: _ownerId, ...rest } = withId(form);
  return rest;
}

export function toFormSummaryDto(form) {
  return {
    id: form._id.toString(),
    title: form.title,
    slug: form.slug,
    status: form.status,
    fieldCount: form.fieldCount ?? form.fields?.length ?? 0,
    responseCount: form.responseCount,
    publishedAt: form.publishedAt,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  };
}

export async function getOwnedForm(ownerId, formId, projection) {
  const form = await forms().findOne({ _id: formId, ownerId }, projection ? { projection } : {});
  if (!form) throw notFound('Form bulunamadı.');
  return form;
}

export async function listForms(ownerId, { status } = {}) {
  const filter = { ownerId, ...(status ? { status } : {}) };
  const documents = await forms()
    .aggregate([
      { $match: filter },
      { $sort: { updatedAt: -1 } },
      { $limit: 500 },
      {
        $project: {
          title: 1,
          slug: 1,
          status: 1,
          responseCount: 1,
          publishedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          fieldCount: { $size: '$fields' },
        },
      },
    ])
    .toArray();
  return documents.map(toFormSummaryDto);
}

async function insertWithUniqueSlug(document) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const form = { ...document, slug: createSlug(document.title) };
    try {
      const { insertedId } = await forms().insertOne(form);
      return { _id: insertedId, ...form };
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw conflict('Bu form için benzersiz bir adres oluşturulamadı.');
}

export async function createForm(ownerId, { title, description }) {
  const now = new Date();
  return insertWithUniqueSlug({
    ownerId,
    title,
    description,
    status: 'draft',
    fields: [],
    settings: { ...DEFAULT_SETTINGS },
    responseCount: 0,
    version: 1,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateForm(ownerId, formId, { version, settings, ...changes }) {
  const current = await getOwnedForm(ownerId, formId, { slug: 1, status: 1, version: 1 });
  if (current.version !== version) {
    throw conflict('Bu form başka bir yerde değiştirildi. Son hali için sayfayı yenile.');
  }

  const set = { ...changes, updatedAt: new Date() };
  for (const [key, value] of Object.entries(settings ?? {})) set[`settings.${key}`] = value;

  let updated;
  try {
    updated = await forms().findOneAndUpdate(
      { _id: formId, ownerId, version },
      { $set: set, $inc: { version: 1 } },
      { returnDocument: 'after' },
    );
  } catch (error) {
    if (error.code === 11000) throw conflict('Bu adres zaten kullanılıyor.');
    throw error;
  }
  if (!updated) {
    throw conflict('Bu form başka bir yerde değiştirildi. Son hali için sayfayı yenile.');
  }

  if (current.status !== 'draft') await revalidatePublicForm(current.slug, updated.slug);
  return updated;
}

export async function duplicateForm(ownerId, formId) {
  const source = await getOwnedForm(ownerId, formId);
  const now = new Date();
  return insertWithUniqueSlug({
    ownerId,
    title: `${source.title} (kopya)`.slice(0, 120),
    description: source.description,
    status: 'draft',
    fields: source.fields,
    settings: source.settings,
    responseCount: 0,
    version: 1,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

export function getPublishProblems(form) {
  const problems = [];
  if (!form.title?.trim()) problems.push({ path: 'title', message: 'Formuna bir başlık ver.' });
  if (form.fields.length === 0) {
    problems.push({ path: 'fields', message: 'Yayınlamadan önce en az bir alan ekle.' });
  }
  form.fields.forEach((field, index) => {
    if (CHOICE_TYPES.has(field.type) && field.options.length === 0) {
      problems.push({
        path: `fields.${index}.options`,
        message: `“${field.label}” alanında en az bir seçenek olmalı.`,
      });
    }
  });
  return problems;
}

export async function changeStatus(ownerId, formId, action) {
  const transition = STATUS_TRANSITIONS[action];
  const form = await getOwnedForm(ownerId, formId);

  if (!transition.from.includes(form.status)) {
    throw conflict(
      `“${STATUS_LABELS[form.status]}” durumundaki bir form “${STATUS_LABELS[transition.to]}” durumuna alınamaz.`,
    );
  }

  if (transition.to === 'published') {
    const problems = getPublishProblems(form);
    if (problems.length > 0) {
      throw new AppError(409, 'CONFLICT', 'Bu form yayınlanmaya hazır değil.', problems);
    }
  }

  const now = new Date();
  const updated = await forms().findOneAndUpdate(
    { _id: formId, ownerId, status: form.status },
    {
      $set: {
        status: transition.to,
        updatedAt: now,
        ...(transition.to === 'published' && !form.publishedAt ? { publishedAt: now } : {}),
      },
    },
    { returnDocument: 'after' },
  );
  if (!updated)
    throw conflict('Bu form başka bir yerde değiştirildi. Sayfayı yenileyip tekrar dene.');

  await revalidatePublicForm(updated.slug);
  return updated;
}

export async function deleteForm(ownerId, formId) {
  const form = await getOwnedForm(ownerId, formId, { slug: 1 });
  await forms().deleteOne({ _id: formId, ownerId });
  await Promise.all([
    collection('responses').deleteMany({ formId }),
    collection('analyticsEvents').deleteMany({ formId }),
    removeFolder(formId.toString()),
  ]);
  await revalidatePublicForm(form.slug);
}
