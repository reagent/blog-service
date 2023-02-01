import { faker } from '@faker-js/faker';
import { DatabasePool } from 'slonik';
import { PostRecord } from '../src/app/services/posts.service';
import { sql } from '../src/db/schema';

const createPost = async (options: {
  pool: DatabasePool;
  post: Partial<PostRecord>;
}): Promise<PostRecord> => {
  const { pool, post: overrides } = options;

  const post: Omit<PostRecord, 'id' | 'createdAt' | 'updatedAt'> = {
    title: faker.random.words(4),
    body: faker.lorem.paragraphs(3),
    publishedAt: faker.date.past(),
    ...overrides,
  };

  return pool.one(sql.typeAlias('post')`
    INSERT INTO posts (title, body, published_at)
    VALUES (${post.title}, ${post.body}, ${sql.timestamp(post.publishedAt)})
    RETURNING id,
              title,
              body,
              published_at AS "publishedAt",
              created_at AS "createdAt",
              updated_at AS "updatedAt"`);
};

export { createPost };
