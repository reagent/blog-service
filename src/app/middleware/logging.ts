import { RequestHandler } from 'express';
import { Loggable } from '@reagent/logging';
import { LogSource } from '../../types';

export const logging = (logger: Loggable<LogSource>): RequestHandler => {
  return (req, resp, next) => {
    const start = new Date().getTime();

    const { method, path, params, query, ip, body, headers } = req;

    logger.info('Request', {
      source: 'handler',
      method,
      path,
      params,
      query,
      ip,
    });

    logger.debug('Request', { source: 'handler', headers, body });

    resp.on('finish', () => {
      const end = new Date().getTime();

      logger.info('Response', {
        source: 'handler',
        status: resp.statusCode,
        duration: end - start,
      });

      logger.debug('Response', {
        source: 'handler',
        headers: resp.getHeaders(),
      });
    });

    next();
  };
};
