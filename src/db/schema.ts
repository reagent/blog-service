import { createSqlTag } from 'slonik';
import { z } from 'zod';

export const sql = createSqlTag({
  typeAliases: {
    count: z.object({ count: z.number() }),

    // Database resources
    post: z.object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
      publishedAt: z.date(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),

    token: z.object({
      value: z.string(),
    }),
  },
});
