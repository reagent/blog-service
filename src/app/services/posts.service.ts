import 'reflect-metadata';
import { DatabasePool } from 'slonik';
import { IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { Type, plainToClass } from 'class-transformer';

import { sql } from '../../db/schema';
import { Errors } from '../../types';
import { validate } from '../../utils/validate';

type UUID = string;

class Post {
  @IsNotEmpty({ message: 'must be supplied' })
  title!: string;

  @IsNotEmpty({ message: 'must be supplied' })
  body!: string;
}

class PostCreate extends Post {
  @IsOptional()
  @IsDate({ message: 'must be a valid date' })
  @Type(() => Date)
  publishedAt?: Date;
}

class PostUpdate extends Post {
  id!: UUID;

  @IsDate({ message: 'must be a valid date' })
  @Type(() => Date)
  publishedAt!: Date;
}

type PostRecord = {
  id: UUID;
  title: string;
  body: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type Result = { instance: PostRecord | null; errors: Errors | null };

class PostsService {
  protected pool: DatabasePool;

  constructor(options: { pool: DatabasePool }) {
    this.pool = options.pool;
  }

  find(id: UUID): Promise<PostRecord | null> {
    const query = sql.typeAlias('post')`
      SELECT id,
             title,
             body,
             published_at AS "publishedAt",
             created_at AS "createdAt",
             updated_at AS "updatedAt"
      FROM   posts
      WHERE  id::text = ${id}`;

    return this.pool.maybeOne(query);
  }

  all(): Promise<Readonly<PostRecord[]>> {
    const query = sql.typeAlias('post')`
      SELECT   id,
               title,
               body,
               published_at AS "publishedAt",
               created_at AS "createdAt",
               updated_at AS "updatedAt"
      FROM     posts
      ORDER BY published_at DESC`;

    return this.pool.any(query);
  }

  async create(input: object): Promise<Result> {
    let instance: PostRecord | null = null;

    const post = plainToClass(PostCreate, input);
    const errors = await validate(post);

    const publishedAt = post.publishedAt || new Date();

    if (!errors) {
      const stmt = sql.typeAlias('post')`
        INSERT INTO posts (title, body, published_at)
        VALUES (${post.title},${post.body},${sql.timestamp(publishedAt)})
        RETURNING id,
                  title,
                  body,
                  published_at AS "publishedAt",
                  created_at AS "createdAt",
                  updated_at AS "updatedAt"`;

      instance = await this.pool.maybeOne(stmt);
    }

    return {
      instance,
      errors,
    };
  }

  async update(existing: PostRecord, updates: object): Promise<Result> {
    const instance = plainToClass(PostUpdate, { ...existing, ...updates });
    const errors = await validate(instance);

    if (errors) {
      return { instance: null, errors };
    }

    const stmt = sql.typeAlias('post')`
      UPDATE    posts
      SET       title = ${instance.title},
                body = ${instance.body},
                published_at = ${sql.timestamp(instance.publishedAt)},
                updated_at = NOW()
      WHERE     id = ${instance.id}
      RETURNING id,
                title,
                body,
                published_at AS "publishedAt",
                created_at AS "createdAt",
                updated_at AS "updatedAt"`;

    const result = await this.pool.one(stmt);

    return Promise.resolve({ instance: result, errors });
  }
}

export { PostRecord, PostsService };
