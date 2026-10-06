import { Request, Response, NextFunction } from 'express';
import {
  AddTrackToPlaylistSchema,
  ApiResponse,
  CreatePlaylistSchema,
  Playlist,
  UpdatePlaylistSchema
} from '@music/shared';
import { mockPlaylists } from '../data/mockPlaylists';
import { mockTracks } from '../data/mockTracks';
import { AppError } from '../middlewares/errorHandler';

let playlistsStore: Playlist[] = [...mockPlaylists];

export class PlaylistController {
  async getPlaylists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: ApiResponse<Playlist[]> = {
        success: true,
        data: playlistsStore,
        meta: {
          total: playlistsStore.length,
          timestamp: new Date().toISOString()
        }
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getPlaylistById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const playlist = playlistsStore.find((p) => p.id === id);

      if (!playlist) {
        throw new AppError(404, `Playlist '${id}' not found`, 'PLAYLIST_NOT_FOUND');
      }

      const response: ApiResponse<Playlist> = {
        success: true,
        data: playlist
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async createPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreatePlaylistSchema.parse(req.body);
      const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        title: input.title,
        description: input.description || '',
        coverUrl:
          input.coverUrl ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        tracks: [],
        trackCount: 0,
        totalDuration: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      playlistsStore.unshift(newPlaylist);

      const response: ApiResponse<Playlist> = {
        success: true,
        data: newPlaylist
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updatePlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = UpdatePlaylistSchema.parse(req.body);
      const index = playlistsStore.findIndex((p) => p.id === id);

      if (index === -1) {
        throw new AppError(404, `Playlist '${id}' not found`, 'PLAYLIST_NOT_FOUND');
      }

      playlistsStore[index] = {
        ...playlistsStore[index],
        ...input,
        updatedAt: new Date().toISOString()
      };

      const response: ApiResponse<Playlist> = {
        success: true,
        data: playlistsStore[index]
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async addTrackToPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { trackId } = AddTrackToPlaylistSchema.parse(req.body);

      const playlistIndex = playlistsStore.findIndex((p) => p.id === id);
      if (playlistIndex === -1) {
        throw new AppError(404, `Playlist '${id}' not found`, 'PLAYLIST_NOT_FOUND');
      }

      const track = mockTracks.find((t) => t.id === trackId);
      if (!track) {
        throw new AppError(404, `Track '${trackId}' not found`, 'TRACK_NOT_FOUND');
      }

      const playlist = playlistsStore[playlistIndex];
      // Prevent duplicate additions
      if (playlist.tracks.some((t) => t.id === trackId)) {
        res.json({ success: true, data: playlist });
        return;
      }

      const updatedTracks = [...playlist.tracks, track];
      playlistsStore[playlistIndex] = {
        ...playlist,
        tracks: updatedTracks,
        trackCount: updatedTracks.length,
        totalDuration: updatedTracks.reduce((sum, t) => sum + t.duration, 0),
        updatedAt: new Date().toISOString()
      };

      const response: ApiResponse<Playlist> = {
        success: true,
        data: playlistsStore[playlistIndex]
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async removeTrackFromPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, trackId } = req.params;

      const playlistIndex = playlistsStore.findIndex((p) => p.id === id);
      if (playlistIndex === -1) {
        throw new AppError(404, `Playlist '${id}' not found`, 'PLAYLIST_NOT_FOUND');
      }

      const playlist = playlistsStore[playlistIndex];
      const updatedTracks = playlist.tracks.filter((t) => t.id !== trackId);

      playlistsStore[playlistIndex] = {
        ...playlist,
        tracks: updatedTracks,
        trackCount: updatedTracks.length,
        totalDuration: updatedTracks.reduce((sum, t) => sum + t.duration, 0),
        updatedAt: new Date().toISOString()
      };

      const response: ApiResponse<Playlist> = {
        success: true,
        data: playlistsStore[playlistIndex]
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const playlistController = new PlaylistController();
