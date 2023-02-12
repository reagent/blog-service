import path from 'path';

import { Migrator, SOURCE as MIGRATOR_SOURCE } from '@reagent/migrator';
import { createLogger } from '@reagent/logging';

import { connect } from './connect';
import { DATABASE_URL, loggerOptions } from '../config';

if (!DATABASE_URL) {
  console.error('No database configuration found, please set `DATABASE_URL`');
  process.exit(1);
}

(async () => {
  const migrationsPath = path.resolve(__dirname, 'migrations');
  const logger = createLogger(loggerOptions);
  const pool = await connect(DATABASE_URL, { logger });

  const migrator = new Migrator({
    migrationsPath,
    pool,
    logger,
  });

  logger.info('Running migrations', { source: MIGRATOR_SOURCE });
  await migrator.migrate();
  logger.info('Migrations complete', { source: MIGRATOR_SOURCE });
})();
