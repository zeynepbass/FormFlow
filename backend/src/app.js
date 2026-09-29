import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { getDb } from './database/client.js';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler.js';
import { requireAuth } from './common/middleware/require-auth.js';
import { createRateLimiters } from './common/middleware/rate-limit.js';
import { verifyOrigin } from './common/middleware/verify-origin.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { formsRoutes } from './modules/forms/forms.routes.js';
import { publicRoutes } from './modules/public/public.routes.js';
import { responsesRoutes } from './modules/responses/responses.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';

export function createApp() {
  const app = express();
  const limiters = createRateLimiters();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
      serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  app.get('/health', async (req, res) => {
    let database = 'up';
    try {
      await getDb().command({ ping: 1 });
    } catch {
      database = 'down';
    }
    res
      .status(database === 'up' ? 200 : 503)
      .json({ status: database === 'up' ? 'ok' : 'degraded', database });
  });

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', verifyOrigin, limiters.api);

  app.use('/api/auth', authRoutes(limiters));
  app.use('/api/users', requireAuth, usersRoutes());
  app.use('/api/forms', requireAuth, formsRoutes(), responsesRoutes(), analyticsRoutes());
  app.use('/api/public', publicRoutes(limiters));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
