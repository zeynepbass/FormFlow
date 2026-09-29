export class ApiError extends Error {
  constructor(
    status,
    { code = 'INTERNAL_ERROR', message = 'Something went wrong.', details } = {},
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details ?? [];
  }
}
