import multer from 'multer';
import { isProduction } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: [413, 'PAYLOAD_TOO_LARGE', 'Files must be 5 MB or smaller.'],
  LIMIT_FILE_COUNT: [400, 'VALIDATION_ERROR', 'Too many files.'],
  LIMIT_UNEXPECTED_FILE: [400, 'VALIDATION_ERROR', 'Unexpected file field.'],
};

function toAppError(error) {
  if (error instanceof AppError) return error;

  if (error instanceof multer.MulterError) {
    const [status, code, message] = MULTER_MESSAGES[error.code] ?? [
      400,
      'VALIDATION_ERROR',
      'The upload could not be processed.',
    ];
    return new AppError(status, code, message);
  }

  if (error.type === 'entity.parse.failed') {
    return new AppError(400, 'VALIDATION_ERROR', 'The request body is not valid JSON.');
  }
  if (error.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large.');
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
      message: 'Something went wrong. Please try again.',
      ...(isProduction ? {} : { debug: error.message }),
    },
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
}
