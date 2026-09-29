import { isProduction } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export const mailer = {
  async send({ to, subject, text }) {
    if (isProduction) {
      logger.warn({ subject }, 'Email delivery is not configured');
      return;
    }
    logger.info({ to, subject, body: text }, 'Outgoing email');
  },
};
