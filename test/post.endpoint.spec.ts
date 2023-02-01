import { randomUUID } from 'crypto';
import { Express } from 'express';
import { DatabasePool } from 'slonik';

import supertest from 'supertest';
import HttpStatus from 'http-status';

import { DATABASE_URL } from './env';
import { createApp } from '../src/app';
import { connect } from '../src/db/connect';
import { sql } from '../src/db/schema';
import { createApiKey, createPost } from './factories';

const datePatternFor = (input: Date): RegExp => {
  const pattern = input.toISOString().replace(/(\.)\d+(\w+)?$/, '$1\\d+$2');
  return new RegExp(`^${pattern}$`);
};

describe('Post Endpoints', () => {
  let pool: DatabasePool;
  let app: Express;

  beforeAll(async () => (pool = await connect(DATABASE_URL!)));
  afterAll(async () => await pool.end());

  beforeEach(async () => {
    await pool.query(sql.unsafe`BEGIN`);
    app = createApp({ pool });
  });

  afterEach(async () => await pool.query(sql.unsafe`ROLLBACK`));

  describe('GET /posts/:id', () => {
    it('responds with 401 (unauthorized) when provided with a non-existent API key', async () => {
      const apiKey = randomUUID();
      const id = randomUUID();

      const response = await supertest(app)
        .get(`/posts/${id}`)
        .set({ Authorization: `Api-Key ${apiKey}` });

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    describe('with a valid API key', () => {
      let apiKey: string;

      beforeEach(async () => (apiKey = await createApiKey(pool)));

      it('responds with 404 (not found) and an empty body when there is no post for the ID', async () => {
        const id = randomUUID();

        const response = await supertest(app)
          .get(`/posts/${id}`)
          .set({ Authorization: `Api-Key ${apiKey}` });

        expect(response.status).toEqual(HttpStatus.NOT_FOUND);
        expect(response.body).toEqual({});
      });

      it('responds with 200 (ok) and the post when there is a post for the provided ID', async () => {
        const { id } = await createPost({
          pool,
          post: { title: 'Title', body: 'Body' },
        });

        const response = await supertest(app)
          .get(`/posts/${id}`)
          .set({ Authorization: `Api-Key ${apiKey}` });

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body).toMatchObject({
          id,
          title: 'Title',
          body: 'Body',
        });
      });
    });
  });

  describe('GET /posts', () => {
    it('responds with 401 (unauthorized) when provided with a non-existent API key', async () => {
      const apiKey = randomUUID();

      const response = await supertest(app)
        .get('/posts')
        .set({ Authorization: `Api-Key ${apiKey}` });

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    describe('with a valid API key', () => {
      let apiKey: string;

      beforeEach(async () => (apiKey = await createApiKey(pool)));

      it('responds with 200 (success) and an empty array when there are no posts', async () => {
        const response = await supertest(app)
          .get('/posts')
          .set({ Authorization: `Api-Key ${apiKey}` });

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body).toEqual([]);
      });

      it('responds with 200 and an array of posts', async () => {
        const post = await createPost({
          pool,
          post: {
            title: 'title',
            body: 'body',
            publishedAt: new Date('2022-08-01T00:00:00Z'),
          },
        });

        const response = await supertest(app)
          .get('/posts')
          .set({ Authorization: `Api-Key ${apiKey}` });

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body).toEqual([
          {
            id: post.id,
            title: 'title',
            body: 'body',
            publishedAt: '2022-08-01T00:00:00.000Z',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        ]);
      });
    });
  });

  describe('POST /posts', () => {
    it('responds with 401 (unauthorized) when provided with a non-existent API key', async () => {
      const apiKey = randomUUID();

      const response = await supertest(app)
        .post('/posts')
        .set({ Authorization: `Api-Key ${apiKey}` });

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    describe('with a valid API key', () => {
      let apiKey: string;

      beforeEach(async () => (apiKey = await createApiKey(pool)));

      it('responds with a 422 (unprocessable entity) when validation fails', async () => {
        const response = await supertest(app)
          .post('/posts')
          .set({ Authorization: `Api-Key ${apiKey}` })
          .send({});

        expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);

        expect(response.body).toEqual({
          errors: {
            body: ['must be supplied'],
            title: ['must be supplied'],
          },
        });
      });

      it('responds with 201 (created) and returns the newly-created post resource', async () => {
        const response = await supertest(app)
          .post('/posts')
          .set({ Authorization: `Api-Key ${apiKey}` })
          .send({
            title: 'Title',
            body: 'Body',
          });

        const now = datePatternFor(new Date());

        expect(response.body).toEqual({
          id: expect.any(String),
          title: 'Title',
          body: 'Body',
          publishedAt: expect.stringMatching(now),
          createdAt: expect.stringMatching(now),
          updatedAt: expect.stringMatching(now),
        });

        expect(response.status).toEqual(HttpStatus.CREATED);
      });

      it('allows overriding the `publishedAt` timestamp', async () => {
        const response = await supertest(app)
          .post('/posts')
          .set({ Authorization: `Api-Key ${apiKey}` })
          .send({
            title: 'Title',
            body: 'Body',
            publishedAt: '2021-01-01T00:00:00Z',
          });

        expect(response.body).toMatchObject({
          publishedAt: '2021-01-01T00:00:00.000Z',
        });

        expect(response.status).toEqual(HttpStatus.CREATED);
      });
    });
  });
});
