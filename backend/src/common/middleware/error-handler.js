import multer from 'multer';
import { isProduction } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: [413, 'PAYLOAD_TOO_LARGE', 'Dosyalar en fazla 5 MB olmalı.'],
  LIMIT_FILE_COUNT: [400, 'VALIDATION_ERROR', 'Çok fazla dosya gönderildi.'],
  LIMIT_UNEXPECTED_FILE: [400, 'VALIDATION_ERROR', 'Beklenmeyen dosya alanı.'],
};

function toAppError(error) {
  if (error instanceof AppError) return error;

  if (error instanceof multer.MulterError) {
    const [status, code, message] = MULTER_MESSAGES[error.code] ?? [
      400,
      'VALIDATION_ERROR',
      'Yükleme işlenemedi.',
    ];
    return new AppError(status, code, message);
  }

  if (error.type === 'entity.parse.failed') {
    return new AppError(400, 'VALIDATION_ERROR', 'İstek gövdesi geçerli bir JSON değil.');
  }
  if (error.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'İstek gövdesi çok büyük.');
  }

  return null;
}

export function errorHandler(error, req, res, _next) {
  const appError = toAppError(error);

  if (appError) {
    res.status(appError.status).json({
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details ? { details: appError.details } : {}),
      },
    });
    return;
  }

  req.log?.error({ err: error }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Bir şeyler ters gitti. Lütfen tekrar dene.',
      ...(isProduction ? {} : { debug: error.message }),
    },
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bulunamadı.' } });
}
