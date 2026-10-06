import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginationQuerySchema, parseLrcLyrics, Track } from '@music/shared';
import { mockTracks, mockLyricsRecord } from '../data/mockTracks';
import { mediaProviderRegistry } from '../providers/MediaProviderRegistry';
import { AppError } from '../middlewares/errorHandler';

// In-memory track store initialized from mock data
let tracksStore: Track[] = [...mockTracks];

export class TrackController {
  async getTracks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = PaginationQuerySchema.parse(req.query);
      let filtered = [...tracksStore];

      // Filter by genre
      if (query.genre) {
        const genreLower = query.genre.toLowerCase();
        filtered = filtered.filter((t) => t.genre.toLowerCase().includes(genreLower));
      }

      // Filter by artist
      if (query.artist) {
        const artistLower = query.artist.toLowerCase();
        filtered = filtered.filter((t) => t.artist.toLowerCase().includes(artistLower));
      }

      // Search term
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(searchLower) ||
            t.artist.toLowerCase().includes(searchLower) ||
            t.album.toLowerCase().includes(searchLower)
        );
      }

      // Sorting
      filtered.sort((a, b) => {
        const fieldA = a[query.sortBy as keyof Track];
        const fieldB = b[query.sortBy as keyof Track];
        if (fieldA === undefined || fieldB === undefined) return 0;
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return query.sortOrder === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        }
        return query.sortOrder === 'asc'
          ? (fieldA as number) - (fieldB as number)
          : (fieldB as number) - (fieldA as number);
      });

      // Pagination
      const total = filtered.length;
      const totalPages = Math.ceil(total / query.limit);
      const startIndex = (query.page - 1) * query.limit;
      const paginated = filtered.slice(startIndex, startIndex + query.limit);

      const response: ApiResponse<Track[]> = {
        success: true,
        data: paginated,
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getTrackById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const track = tracksStore.find((t) => t.id === id);

      if (!track) {
        throw new AppError(404, `Track '${id}' not found`, 'TRACK_NOT_FOUND');
      }

      // Resolve stream source from the registered media provider
      const provider = mediaProviderRegistry.getProvider(track.providerId);
      const streamSource = await provider.getStreamSource(track.id);

      const response: ApiResponse<{ track: Track; streamSource: typeof streamSource }> = {
        success: true,
        data: {
          track,
          streamSource
        }
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getTrackLyrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const track = tracksStore.find((t) => t.id === id);

      if (!track) {
        throw new AppError(404, `Track '${id}' not found`, 'TRACK_NOT_FOUND');
      }

      // Check registered media provider first
      const provider = mediaProviderRegistry.getProvider(track.providerId);
      let rawLrc = provider.getLyrics ? await provider.getLyrics(track.id) : null;

      // Fallback to built-in mock lyrics catalog
      if (!rawLrc && mockLyricsRecord[id]) {
        rawLrc = mockLyricsRecord[id];
      }

      if (!rawLrc) {
        const emptyResponse: ApiResponse<null> = {
          success: true,
          data: null,
          meta: { timestamp: new Date().toISOString() }
        };
        res.json(emptyResponse);
        return;
      }

      const parsedLyrics = parseLrcLyrics(rawLrc, track.id);

      const response: ApiResponse<typeof parsedLyrics> = {
        success: true,
        data: parsedLyrics,
        meta: { timestamp: new Date().toISOString() }
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async toggleLike(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const trackIndex = tracksStore.findIndex((t) => t.id === id);

      if (trackIndex === -1) {
        throw new AppError(404, `Track '${id}' not found`, 'TRACK_NOT_FOUND');
      }

      tracksStore[trackIndex] = {
        ...tracksStore[trackIndex],
        isLiked: !tracksStore[trackIndex].isLiked
      };

      const response: ApiResponse<Track> = {
        success: true,
        data: tracksStore[trackIndex]
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const trackController = new TrackController();
