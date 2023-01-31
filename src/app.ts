import express, { Express, json } from 'express';
import { DatabasePool } from 'slonik';
import HttpStatus from 'http-status';

import { PostsService } from './app/services/posts.service';
import { authorization } from './app/middleware/authorization';

export const createApp = (options: { pool: DatabasePool }): Express => {
  const { pool } = options;

  const app = express();

  app.use(json());
  app.use(authorization(pool));

  app.get('/authorization/status', async (req, resp) => {
    // Authorization middleware will respond with unauthorized status
    resp.status(HttpStatus.OK).end();
  });

  app.post('/posts', async (req, resp) => {
    const { CREATED, UNPROCESSABLE_ENTITY } = HttpStatus;

    const service = new PostsService({ pool });
    const { instance: post, errors } = await service.create(req.body);

    if (errors) {
      resp.status(UNPROCESSABLE_ENTITY).send({ errors }).end();
      return;
    }

    resp.status(CREATED).send(post).end();
  });

  return app;
};
