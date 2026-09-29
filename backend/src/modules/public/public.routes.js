import { Router } from 'express';
import { z } from 'zod';
import { collection } from '../../database/client.js';
import { AppError, badRequest, notFound } from '../../common/errors/app-error.js';
import { parse } from '../../common/validation/parse.js';
import { recordEvent } from '../analytics/analytics.service.js';
import { submissionSchema } from '../responses/responses.schemas.js';
import { submitResponse } from '../responses/responses.service.js';
import { parseMultipart } from '../responses/uploads.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const eventSchema = z
  .object({
    type: z.enum(['view', 'start']),
    visitorId: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
  })
  .strict();

function toPublicFormDto(form) {
  return {
    slug: form.slug,
    title: form.title,
    description: form.description,
    status: form.status,
    updatedAt: form.updatedAt,
    settings: form.settings,
    fields: form.fields.map(
      ({ id, type, label, description, placeholder, required, options, validation }) => ({
        id,
        type,
        label,
        description,
        placeholder,
        required,
        options,
        validation,
      }),
    ),
  };
}

async function findPublicForm(slug, statuses = ['published', 'paused']) {
  if (typeof slug !== 'string' || slug.length > 60 || !SLUG_PATTERN.test(slug)) throw notFound();
  const form = await collection('forms').findOne({ slug, status: { $in: statuses } });
  if (!form) throw notFound('Form not found.');
  return form;
}

async function findOpenForm(slug) {
  const form = await findPublicForm(slug);
  if (form.status !== 'published') {
    throw new AppError(409, 'FORM_CLOSED', 'This form is not accepting responses right now.');
  }
  return form;
}

function readSubmission(req) {
  if (!req.is('multipart/form-data')) return req.body;
  try {
    return JSON.parse(req.body?.payload ?? '');
  } catch {
    throw badRequest('The submission is not valid.');
  }
}

export function publicRoutes(limiters) {
  const router = Router();

  router.get('/forms/:slug', async (req, res) => {
    const form = await findPublicForm(req.params.slug);
    res.json({ data: toPublicFormDto(form) });
  });

  router.post(
    '/forms/:slug/responses',
    limiters.submitPerIp,
    limiters.submitPerForm,
    async (req, res, next) => {
      req.form = await findOpenForm(req.params.slug);
      next();
    },
    (req, res, next) => (req.is('multipart/form-data') ? parseMultipart(req, res, next) : next()),
    async (req, res) => {
      const submission = parse(submissionSchema, readSubmission(req));
      const successMessage = req.form.settings.successMessage;

      if (submission.website) {
        res.status(201).json({ data: { message: successMessage } });
        return;
      }

      await submitResponse(req.form, submission, req.files ?? []);
      res.status(201).json({ data: { message: successMessage } });
    },
  );

  router.post('/forms/:slug/events', limiters.events, async (req, res) => {
    const { type, visitorId } = parse(eventSchema, req.body);
    const form = await findOpenForm(req.params.slug);
    await recordEvent(form._id, type, visitorId);
    res.status(202).json({ data: { recorded: true } });
  });

  return router;
}
