import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';
import { Express } from 'express';
import { DatabasePool, createPool, createSqlTag } from 'slonik';
import { z } from 'zod';
import supertest from 'supertest';
import HttpStatus from 'http-status';

import { createApp } from '../src/app';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

const { DATABASE_URL } = process.env;

const sql = createSqlTag({ typeAliases: { uuid: z.string() } });

describe('Authorization Endpoints', () => {
  let app: Express;
  let pool: DatabasePool;

  beforeAll(async () => (pool = await createPool(DATABASE_URL!)));
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
      const apiKey = randomUUID();

      const response = await supertest(app)
        .get('/authorization/status')
        .set({ Authorization: `Api-Key ${apiKey}` });

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('responds with a 200 (success) when given a valid API key', async () => {
      const token = z.object({ value: z.string() });

      const { value: apiKey } = await pool.one(
        sql.type(token)`INSERT INTO tokens DEFAULT VALUES RETURNING value`
      );

      const response = await supertest(app)
        .get('/authorization/status')
        .set({ Authorization: `Api-Key ${apiKey}` });

      expect(response.status).toEqual(HttpStatus.OK);
      expect(response.body).toEqual({});
    });
  });
});
