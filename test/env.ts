import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

const { DATABASE_URL } = process.env;

export { DATABASE_URL };
