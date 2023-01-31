import { createSqlTag } from 'slonik';
import { z } from 'zod';

export const sql = createSqlTag({
  typeAliases: {
    // Database resources
    token: z.object({
      value: z.string(),
    }),
  },
});
