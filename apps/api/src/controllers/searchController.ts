import { Request, Response, NextFunction } from 'express';
import { SearchQuerySchema } from '../schemas/search.schema';
import { mediaService } from '../services/mediaService';
import { AppError } from '../middleware';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = SearchQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => i.message).join('; ');
        throw new AppError(400, `Invalid search query: ${issues}`, 'VALIDATION_ERROR', parsed.error.format());
      }

      const { q, limit } = parsed.data;
      const { tracks } = await mediaService.searchTracks(q, limit);

      res.json({
        data: tracks,
        meta: {
          query: q,
          count: tracks.length
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
