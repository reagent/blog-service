import { createLogger } from '@reagent/logging';

import { LogSource } from './types';
import { createApp } from './app';
import { DATABASE_URL, PORT, loggerOptions } from './config';
import { connect } from './db/connect';

if (!DATABASE_URL) {
  console.error('No database configuration found, please set `DATABASE_URL`');
  process.exit(1);
}

const logger = createLogger<LogSource>(loggerOptions);

(async () => {
  const pool = await connect(DATABASE_URL, { logger });
  const app = createApp({ pool, logger });

  app.listen(PORT, () =>
    logger.info('Listening', { source: 'server', port: PORT })
  );
})();
