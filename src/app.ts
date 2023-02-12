import express, { Express, json } from 'express';
import { DatabasePool } from 'slonik';
import HttpStatus from 'http-status';

import { PostsService } from './app/services/posts.service';
import { authorization } from './app/middleware/authorization';
import { logging } from './app/middleware/logging';
import { Loggable, NullLogger } from '@reagent/logging';
import { LogSource } from './types';

type ApplicationOptions = {
  pool: DatabasePool;
  logger?: Loggable<LogSource>;
};

export const createApp = (options: ApplicationOptions): Express => {
  const { pool, logger = new NullLogger() } = options;

  const app = express();

  app.use(json());
  app.use(logging(logger));
  app.use(authorization(pool));

  app.get('/authorization/status', async (req, resp) => {
    // Authorization middleware will respond with unauthorized status
    resp.status(HttpStatus.OK).end();
  });

  app.get('/posts/:id', async (req, resp) => {
    const { OK, NOT_FOUND } = HttpStatus;
    const service = new PostsService({ pool });

    const { id } = req.params;

    const post = await service.find(id);

    if (!post) {
      resp.status(NOT_FOUND).end();
      return;
    }

    resp.status(OK).send(post).end();
  });

  app.get('/posts', async (_, resp) => {
    const service = new PostsService({ pool });
    const posts = await service.all();

    resp.status(HttpStatus.OK).send(posts).end();
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

  app.put('/posts/:id', async (req, resp) => {
    const { NOT_FOUND, OK, UNPROCESSABLE_ENTITY } = HttpStatus;

    const service = new PostsService({ pool });
    const existing = await service.find(req.params.id);

    if (!existing) {
      resp.status(NOT_FOUND).end();
      return;
    }

    const { instance: post, errors } = await service.update(existing, req.body);

    if (errors) {
      resp.status(UNPROCESSABLE_ENTITY).send({ errors }).end();
      return;
    }

    resp.status(OK).send(post).end();
  });

  return app;
};
