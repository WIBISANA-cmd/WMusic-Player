import { z } from 'zod';
import { Track, TrackSchema } from './track';

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  trackCount: number;
  totalDuration: number;
  isSystemPlaylist?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CreatePlaylistSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(300).optional().default(''),
  coverUrl: z.string().url().optional()
});

export const UpdatePlaylistSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  coverUrl: z.string().url().optional()
});

export const AddTrackToPlaylistSchema = z.object({
  trackId: z.string().min(1)
});

export type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistSchema>;
