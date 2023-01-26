import path from 'path';
import dotenv from 'dotenv';
import { createPool } from 'slonik';
import { Migrator } from '@reagent/migrator';

dotenv.config();

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('No database configuration found, please set `DATABASE_URL`');
  process.exit(1);
}

(async () => {
  const migrationsPath = path.resolve(__dirname, 'migrations');
  const pool = await createPool(DATABASE_URL);

  const migrator = new Migrator({ migrationsPath, pool });
  await migrator.migrate();
})();
