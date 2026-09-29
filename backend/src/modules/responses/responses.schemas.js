import { z } from 'zod';

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-AA-GG biçimini kullan.')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Geçersiz tarih.');

export const responseFilterSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    from: day.optional(),
    to: day.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'Başlangıç tarihi bitiş tarihinden önce olmalı.',
    path: ['from'],
  });

export const listResponsesQuerySchema = responseFilterSchema.and(
  z.object({
    cursor: z.string().max(100).optional(),
    dir: z.enum(['next', 'prev']).default('next'),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),
);

export const submissionSchema = z
  .object({
    answers: z
      .record(z.string().max(20), z.unknown())
      .refine((value) => Object.keys(value).length <= 60, 'Çok fazla yanıt gönderildi.'),
    visitorId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{16,64}$/)
      .optional(),
    website: z.string().max(200).optional(),
  })
  .strict();
