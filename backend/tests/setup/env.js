import os from 'node:os';
import path from 'node:path';
import { inject } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = `${inject('mongoUri')}formflow-test`;
process.env.AUTH_SECRET = 'test-secret-that-is-long-enough-for-hmac-usage';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.APP_URL = 'http://localhost:3000';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'formflow-test-uploads');
process.env.TRUST_PROXY = '0';
