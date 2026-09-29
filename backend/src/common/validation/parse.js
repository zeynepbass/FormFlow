import { badRequest } from '../errors/app-error.js';

export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw badRequest('Some fields are invalid.', details);
  }
  return result.data;
}
