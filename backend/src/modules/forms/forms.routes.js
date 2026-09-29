import { Router } from 'express';
import { toObjectId } from '../../common/validation/object-id.js';
import { parse } from '../../common/validation/parse.js';
import { createFormSchema, listFormsQuerySchema, updateFormSchema } from './forms.schemas.js';
import * as formsService from './forms.service.js';

export function formsRoutes() {
  const router = Router();
  router.use((req, res, next) => {
    res.set('cache-control', 'private, no-store');
    next();
  });

  router.get('/', async (req, res) => {
    const query = parse(listFormsQuerySchema, req.query);
    res.json({ data: await formsService.listForms(req.user._id, query) });
  });

  router.post('/', async (req, res) => {
    const input = parse(createFormSchema, req.body);
    const form = await formsService.createForm(req.user._id, input);
    res.status(201).json({ data: formsService.toFormDto(form) });
  });

  router.get('/:id', async (req, res) => {
    const form = await formsService.getOwnedForm(req.user._id, toObjectId(req.params.id));
    res.json({ data: formsService.toFormDto(form) });
  });

  router.patch('/:id', async (req, res) => {
    const input = parse(updateFormSchema, req.body);
    const form = await formsService.updateForm(req.user._id, toObjectId(req.params.id), input);
    res.json({ data: formsService.toFormDto(form) });
  });

  router.delete('/:id', async (req, res) => {
    await formsService.deleteForm(req.user._id, toObjectId(req.params.id));
    res.status(204).end();
  });

  router.post('/:id/duplicate', async (req, res) => {
    const form = await formsService.duplicateForm(req.user._id, toObjectId(req.params.id));
    res.status(201).json({ data: formsService.toFormDto(form) });
  });

  for (const action of ['publish', 'pause', 'archive', 'restore']) {
    router.post(`/:id/${action}`, async (req, res) => {
      const form = await formsService.changeStatus(req.user._id, toObjectId(req.params.id), action);
      res.json({ data: formsService.toFormDto(form) });
    });
  }

  return router;
}
