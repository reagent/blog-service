import path from 'path';
import dotenv from 'dotenv';

import { createApp } from './app';
import { connect } from './db/connect';
import { createLogger } from '@reagent/logging';
import { LogSource } from './types';

dotenv.config();

const {
  DATABASE_URL,
  LOG_LEVEL,
  LOG_FORMAT = 'plain',
  NODE_ENV = 'development',
  PORT = '3000',
} = process.env;

const logger = createLogger<LogSource>({
  format: LOG_FORMAT,
  level: LOG_LEVEL,
  filePath: path.resolve(__dirname, '..', 'log', `${NODE_ENV}.log`),
  stdout: NODE_ENV === 'development',
});

if (!DATABASE_URL) {
  console.error('No database configuration found, please set `DATABASE_URL`');
  process.exit(1);
}

(async () => {
  const pool = await connect(DATABASE_URL, { logger });
  const app = createApp({ pool, logger });

  app.listen(PORT, () =>
    logger.info('Listening', { source: 'server', port: PORT })
  );
})();
