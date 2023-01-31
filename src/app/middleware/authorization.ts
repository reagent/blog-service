import HttpStatus from 'http-status';
import { NextFunction, Request, Response } from 'express';
import { DatabasePool } from 'slonik';
import { sql } from '../../db/schema';

type MiddlewareFunc = (
  req: Request,
  resp: Response,
  next: NextFunction
) => void;

const extractApiKeyFrom = (
  headerValue: string | undefined
): string | undefined => {
  let apiKey: string | undefined = undefined;

  if (!headerValue) {
    return apiKey;
  }

  const match = headerValue.match(/^api-key\s+(?<apiKey>\S+)$/i);

  if (match) {
    ({ apiKey } = match.groups!);
  }

  return apiKey;
};

export const authorization = (pool: DatabasePool): MiddlewareFunc => {
  return async (req, resp, next) => {
    const apiKey = extractApiKeyFrom(req.header('authorization'));

    if (!apiKey) {
      resp.status(HttpStatus.UNAUTHORIZED).end();
      return;
    }

    const token = await pool.maybeOne(
      sql.typeAlias('token')`
        SELECT value FROM tokens WHERE value::text = ${apiKey}`
    );

    if (!token) {
      resp.status(HttpStatus.UNAUTHORIZED).end();
      return;
    }

    next();
  };
};
