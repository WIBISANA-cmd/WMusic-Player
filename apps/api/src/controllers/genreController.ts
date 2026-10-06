import { Request, Response, NextFunction } from 'express';
import { ApiResponse, GenreCategory } from '@music/shared';
import { mockGenres } from '../data/mockGenres';

export class GenreController {
  async getGenres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: ApiResponse<GenreCategory[]> = {
        success: true,
        data: mockGenres,
        meta: {
          total: mockGenres.length,
          timestamp: new Date().toISOString()
        }
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const genreController = new GenreController();
