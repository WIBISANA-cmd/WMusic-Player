import { z } from 'zod';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    timestamp?: string;
  };
}

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  genre: z.string().optional(),
  artist: z.string().optional(),
  sortBy: z.enum(['title', 'artist', 'duration', 'releaseYear', 'playCount', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query must not be empty'),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
