import {
  DatabasePool,
  Interceptor,
  TypeParser,
  createPool,
  createTypeParserPreset,
} from 'slonik';

import { Loggable, NullLogger } from '@reagent/logging';
import { LogSource } from '../types';

const timestampParser = (): TypeParser => {
  return {
    name: 'timestamp',
    parse: (value: string | null): Date | null =>
      value ? new Date(value) : null,
  };
};

const queryLogger = (
  logger: Loggable<LogSource>
): Interceptor['beforeQueryExecution'] => {
  return (_ctx, query) => {
    logger.debug('Query', {
      source: 'database',
      sql: query.sql,
      values: query.values,
    });

    return Promise.resolve(null);
  };
};

export const connect = (
  databaseUrl: string,
  options?: { logger: Loggable<LogSource> }
): Promise<DatabasePool> => {
  const { logger = new NullLogger() } = options || {};
  const typeParsers = [...createTypeParserPreset(), timestampParser()];

  return createPool(databaseUrl, {
    typeParsers,
    interceptors: [{ beforeQueryExecution: queryLogger(logger) }],
  });
};
