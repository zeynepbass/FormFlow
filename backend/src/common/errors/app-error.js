export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message = 'İstek geçersiz.', details) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);

export const unauthenticated = (message = 'Devam etmek için giriş yapmalısın.') =>
  new AppError(401, 'UNAUTHENTICATED', message);

export const forbidden = (message = 'Bu işlem için yetkin yok.') =>
  new AppError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Bulunamadı.') => new AppError(404, 'NOT_FOUND', message);

export const conflict = (message) => new AppError(409, 'CONFLICT', message);

export const payloadTooLarge = (message = 'Yüklenen dosya çok büyük.') =>
  new AppError(413, 'PAYLOAD_TOO_LARGE', message);

export const unsupportedMediaType = (message = 'Bu dosya türüne izin verilmiyor.') =>
  new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', message);
