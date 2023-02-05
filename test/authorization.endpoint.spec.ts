import { faker } from '@faker-js/faker';
import { Express } from 'express';
import { DatabasePool } from 'slonik';

import supertest from 'supertest';
import HttpStatus from 'http-status';

import { DATABASE_URL } from './env';
import { createApp } from '../src/app';
import { connect } from '../src/db/connect';
import { sql } from '../src/db/schema';
import { createApiKey } from './factories';

describe('Authorization Endpoints', () => {
  let app: Express;
  let pool: DatabasePool;

  beforeAll(async () => (pool = await connect(DATABASE_URL!)));
  afterAll(async () => await pool.end());

  beforeEach(async () => {
    await pool.query(sql.unsafe`BEGIN`);
    app = createApp({ pool });
  });

  afterEach(async () => await pool.query(sql.unsafe`ROLLBACK`));

  describe('GET /authorization/status', () => {
    it('responds with a 401 (Unauthorized) when no API key is provided', async () => {
      const response = await supertest(app).get('/authorization/status');

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({});
    });

    it('responds with a 401 when given an API key with an invalid format', async () => {
      const response = await supertest(app)
        .get('/authorization/status')
        .set({ Authorization: 'Api-Key invalid' });
      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('responds with a 401 when an non-existent API key is provided', async () => {
      const apiKey = faker.datatype.uuid();

      const response = await supertest(app)
        .get('/authorization/status')
        .set({ Authorization: `Api-Key ${apiKey}` });

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('responds with a 200 (success) when given a valid API key', async () => {
      const apiKey = await createApiKey(pool);

      const response = await supertest(app)
        .get('/authorization/status')
        .set({ Authorization: `Api-Key ${apiKey}` });

      expect(response.status).toEqual(HttpStatus.OK);
      expect(response.body).toEqual({});
    });
  });
});
