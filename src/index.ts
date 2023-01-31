import dotenv from 'dotenv';

import { createApp } from './app';
import { connect } from './db/connect';

dotenv.config();

const { DATABASE_URL, PORT = '3000' } = process.env;

if (!DATABASE_URL) {
  console.error('No database configuration found, please set `DATABASE_URL`');
  process.exit(1);
}

(async () => {
  const pool = await connect(DATABASE_URL);
  const app = createApp({ pool });

  app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
})();