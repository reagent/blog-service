import express, { Express, json } from 'express';
import { DatabasePool, createSqlTag } from 'slonik';
import { z } from 'zod';
import HttpStatus from 'http-status';

export const createApp = (options: { pool: DatabasePool }): Express => {
  const { pool } = options;

  const app = express();
  app.use(json());

  const sql = createSqlTag({
    typeAliases: { uuid: z.string() },
  });

  app.get('/authorization/status', async (req, resp) => {
    let status: number = HttpStatus.UNAUTHORIZED;

    const authHeader = req.header('authorization');

    if (authHeader) {
      const match = authHeader.match(/^api-key\s+(?<apiKey>\S+)$/i);

      if (match) {
        const { apiKey } = match.groups!;

        const id = await pool.maybeOne(
          sql.typeAlias(
            'uuid'
          )`SELECT value FROM tokens WHERE value::text = ${apiKey}`
        );

        if (id) {
          status = HttpStatus.OK;
        }
      }
    }
    resp.status(status).end();
  });

  return app;
};
