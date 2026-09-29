import { Router } from 'express';
import { z } from 'zod';
import { toObjectId } from '../../common/validation/object-id.js';
import { parse } from '../../common/validation/parse.js';
import { getOwnedForm } from '../forms/forms.service.js';
import { RANGES, getAnalytics } from './analytics.service.js';

const querySchema = z.object({
  range: z.enum(Object.keys(RANGES)).default('30d'),
});

export function analyticsRoutes() {
  const router = Router();

  router.get('/:id/analytics', async (req, res) => {
    const { range } = parse(querySchema, req.query);
    const form = await getOwnedForm(req.user._id, toObjectId(req.params.id), { _id: 1 });
    res.set('cache-control', 'private, no-store');
    res.json({ data: await getAnalytics(form._id, range) });
  });

  return router;
}
