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

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishedAt?: Date;
}

type PostRecord = {
  id: UUID;
  title: string;
  body: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type CreateResult = { instance: PostRecord | null; errors: Errors | null };

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

  async create(input: object): Promise<CreateResult> {
    let instance: PostRecord | null = null;

    const post = plainToClass(Post, input);
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
}

export { PostRecord, PostsService };
