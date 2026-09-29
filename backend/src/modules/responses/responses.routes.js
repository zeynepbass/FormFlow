import { pipeline } from 'node:stream/promises';
import { Router } from 'express';
import { toObjectId } from '../../common/validation/object-id.js';
import { parse } from '../../common/validation/parse.js';
import { getOwnedForm } from '../forms/forms.service.js';
import { listResponsesQuerySchema, responseFilterSchema } from './responses.schemas.js';
import * as responsesService from './responses.service.js';

const ownedForm = (req) => getOwnedForm(req.user._id, toObjectId(req.params.id));

export function responsesRoutes() {
  const router = Router();

  router.get('/:id/responses', async (req, res) => {
    const query = parse(listResponsesQuerySchema, req.query);
    const form = await ownedForm(req);
    const { items, meta } = await responsesService.listResponses(form, query);
    res.set('cache-control', 'private, no-store');
    res.json({ data: items, meta });
  });

  router.get('/:id/responses/:responseId', async (req, res) => {
    const form = await ownedForm(req);
    const response = await responsesService.getResponse(form, toObjectId(req.params.responseId));
    res.set('cache-control', 'private, no-store');
    res.json({ data: responsesService.toResponseDto(response) });
  });

  router.delete('/:id/responses/:responseId', async (req, res) => {
    const form = await ownedForm(req);
    await responsesService.deleteResponse(form, toObjectId(req.params.responseId));
    res.status(204).end();
  });

  router.get('/:id/responses/:responseId/files/:fileId', async (req, res) => {
    const form = await ownedForm(req);
    const file = await responsesService.openResponseFile(
      form,
      toObjectId(req.params.responseId),
      req.params.fileId,
    );

    res.set({
      'content-type': file.mimeType,
      'content-length': String(file.size),
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'content-security-policy': "sandbox; default-src 'none'",
      'cache-control': 'private, no-store',
    });
    await pipeline(file.stream, res);
  });

  router.get('/:id/export', async (req, res) => {
    const filters = parse(responseFilterSchema, req.query);
    const form = await ownedForm(req);
    const date = new Date().toISOString().slice(0, 10);

    res.set({
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${form.slug}-yanitlar-${date}.csv"`,
      'cache-control': 'private, no-store',
    });
    await responsesService.exportResponses(form, filters, res);
  });

  return router;
}
