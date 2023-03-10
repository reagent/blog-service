import { faker } from '@faker-js/faker';
import { DatabasePool } from 'slonik';

import { DATABASE_URL } from '../../../test/env';
import { PostsService } from './posts.service';
import { connect } from '../../db/connect';
import { sql } from '../../db/schema';
import { createPost } from '../../../test/factories';

describe(PostsService.name, () => {
  let pool: DatabasePool;
  let subject: PostsService;

  beforeAll(async () => (pool = await connect(DATABASE_URL!)));
  afterAll(async () => await pool.end());
  afterEach(async () => await pool.query(sql.unsafe`ROLLBACK`));

  beforeEach(async () => {
    await pool.query(sql.unsafe`BEGIN`);
    subject = new PostsService({ pool });
  });

  const count = async (pool: DatabasePool): Promise<number> => {
    const { count } = await pool.one(
      sql.typeAlias('count')`SELECT COUNT(*) FROM posts`
    );

    return count;
  };

  describe('find()', () => {
    it('returns `null` when there is no post for the provided ID', () => {
      expect(subject.find(faker.datatype.uuid())).resolves.toBeNull();
    });

    it('returns the post for the provided ID', async () => {
      const post = await createPost({ pool });
      expect(subject.find(post.id)).resolves.toMatchObject({ id: post.id });
    });
  });

  describe('all()', () => {
    it('returns an empty array when there are no posts', async () => {
      expect(subject.all()).resolves.toEqual([]);
    });

    it('returns a list of posts descending by publication date', async () => {
      const older = await createPost({
        pool,
        post: { publishedAt: new Date('2021-01-01') },
      });

      const newer = await createPost({
        pool,
        post: { publishedAt: new Date('2022-01-01') },
      });

      expect(subject.all()).resolves.toMatchObject([
        { id: newer.id },
        { id: older.id },
      ]);
    });
  });

  describe('create()', () => {
    it('does not create a record and returns error messages when the post is invalid', async () => {
      const { instance, errors } = await subject.create({});

      expect(instance).toBeNull();

      expect(errors).toEqual({
        title: ['must be supplied'],
        body: ['must be supplied'],
      });

      expect(count(pool)).resolves.toEqual(0);
    });

    it('creates a record and returns the newly created post when the post is valid', async () => {
      const { instance, errors } = await subject.create({
        title: 'Title',
        body: 'Body',
      });

      expect(errors).toBeNull();

      expect(instance).toEqual({
        id: expect.any(String),
        title: 'Title',
        body: 'Body',
        publishedAt: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(count(pool)).resolves.toEqual(1);
    });

    it('allows the `publishedAt` timestamp to be overridden', async () => {
      const now = new Date();

      const { instance, errors } = await subject.create({
        title: 'Title',
        body: 'Body',
        publishedAt: now,
      });

      expect(errors).toBeNull();

      expect(instance).toMatchObject({
        publishedAt: now,
      });
    });
  });

  describe('update()', () => {
    it('returns no post and errors when the update is invalid', async () => {
      const existing = await createPost({ pool });

      const { instance, errors } = await subject.update(existing, {
        title: '',
        publishedAt: 'wut',
      });

      expect(instance).toBeNull();
      expect(errors).toEqual({
        title: ['must be supplied'],
        publishedAt: ['must be a valid date'],
      });
    });

    it('updates the post and returns the new attributes when the update is successful', async () => {
      const existing = await createPost({
        pool,
        post: {
          title: 'Old Title',
          body: 'Old Body',
          publishedAt: new Date('2022-01-01T00:00:00Z'),
        },
      });

      const { instance, errors } = await subject.update(existing, {
        title: 'New Title',
        body: 'New Body',
        publishedAt: new Date('2023-01-01T00:00:00Z'),
      });

      expect(errors).toBeNull();

      expect(instance).toMatchObject({
        id: existing.id,
        title: 'New Title',
        body: 'New Body',
        publishedAt: new Date('2023-01-01T00:00:00.000Z'),
      });

      const updated = await subject.find(existing.id);

      expect(updated).toMatchObject({
        id: existing.id,
        title: 'New Title',
        body: 'New Body',
        publishedAt: new Date('2023-01-01T00:00:00.000Z'),
      });
    });
  });
});
