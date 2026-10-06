import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z
    .string({
      required_error: 'Query parameter "q" is required',
      invalid_type_error: 'Query parameter "q" must be a string'
    })
    .trim()
    .min(1, { message: 'Search query must be at least 1 character long' })
    .max(100, { message: 'Search query must not exceed 100 characters' }),
  limit: z.coerce
    .number()
    .int()
    .min(1, { message: 'Limit must be at least 1' })
    .max(100, { message: 'Limit cannot exceed 100' })
    .default(20)
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;

