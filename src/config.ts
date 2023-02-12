import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL,
  LOG_LEVEL,
  LOG_FORMAT = 'plain',
  NODE_ENV = 'development',
  PORT = '3000',
} = process.env;

const loggerOptions = {
  format: LOG_FORMAT,
  level: LOG_LEVEL,
  filePath: path.resolve(__dirname, '..', 'log', `${NODE_ENV}.log`),
  stdout: NODE_ENV === 'development',
};

export { DATABASE_URL, NODE_ENV, PORT, loggerOptions };
