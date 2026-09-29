import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

let client;
let db;

export async function connectDatabase(uri = env.MONGODB_URI) {
  client = new MongoClient(uri, { maxPoolSize: 20 });
  await client.connect();
  db = client.db();
  return db;
}

export async function disconnectDatabase() {
  await client?.close();
  client = undefined;
  db = undefined;
}

export function getDb() {
  if (!db) throw new Error('Database is not connected');
  return db;
}

export function collection(name) {
  return getDb().collection(name);
}
