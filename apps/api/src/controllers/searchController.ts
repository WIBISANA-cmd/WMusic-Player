import { Request, Response, NextFunction } from 'express';
import { ApiResponse, SearchQuerySchema, Track, Playlist, GenreCategory } from '@music/shared';
import { mockTracks } from '../data/mockTracks';
import { mockPlaylists } from '../data/mockPlaylists';
import { mockGenres } from '../data/mockGenres';

export interface SearchResults {
  tracks: Track[];
  playlists: Playlist[];
  genres: GenreCategory[];
}

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, limit } = SearchQuerySchema.parse(req.query);
      const query = q.trim().toLowerCase();

      const matchedTracks = mockTracks
        .filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            t.artist.toLowerCase().includes(query) ||
            t.album.toLowerCase().includes(query) ||
            t.genre.toLowerCase().includes(query)
        )
        .slice(0, limit);

      const matchedPlaylists = mockPlaylists
        .filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        )
        .slice(0, limit);

      const matchedGenres = mockGenres
        .filter((g) => g.name.toLowerCase().includes(query) || g.id.toLowerCase().includes(query))
        .slice(0, limit);

      const response: ApiResponse<SearchResults> = {
        success: true,
        data: {
          tracks: matchedTracks,
          playlists: matchedPlaylists,
          genres: matchedGenres
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
