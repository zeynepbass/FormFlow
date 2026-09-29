import { ObjectId } from 'mongodb';
import { notFound } from '../errors/app-error.js';

export function toObjectId(value) {
  if (typeof value !== 'string' || !ObjectId.isValid(value) || value.length !== 24) {
    throw notFound();
  }
  return new ObjectId(value);
}
