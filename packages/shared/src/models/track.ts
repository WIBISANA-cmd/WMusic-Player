import { z } from 'zod';
import { MediaProviderTypeSchema, StreamQualitySchema } from './media-provider';

export interface TrackWaveform {
  peaks: number[];
  length: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  genre: string;
  bpm?: number;
  releaseYear?: number;
  isExplicit?: boolean;
  providerId: string;
  providerType: 'local' | 's3' | 'cdn' | 'youtube_official' | 'custom';
  fileSize?: number; // in bytes
  format?: string;
  waveform?: number[];
  hasLyrics?: boolean;
  playCount?: number;
  isLiked?: boolean;
  createdAt?: string;
}

export const TrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  artistId: z.string().optional(),
  album: z.string().min(1),
  albumId: z.string().optional(),
  duration: z.number().nonnegative(),
  coverUrl: z.string().url(),
  audioUrl: z.string(),
  genre: z.string().min(1),
  bpm: z.number().optional(),
  releaseYear: z.number().int().optional(),
  isExplicit: z.boolean().optional().default(false),
  providerId: z.string().min(1),
  providerType: MediaProviderTypeSchema,
  fileSize: z.number().optional(),
  format: z.string().optional(),
  waveform: z.array(z.number()).optional(),
  hasLyrics: z.boolean().optional().default(false),
  playCount: z.number().optional().default(0),
  isLiked: z.boolean().optional().default(false),
  createdAt: z.string().optional()
});

export type TrackInput = z.infer<typeof TrackSchema>;

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  genres: string[];
  trackCount: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  releaseYear: number;
  trackCount: number;
  totalDuration: number;
  tracks?: Track[];
}

export interface GenreCategory {
  id: string;
  name: string;
  gradient: string;
  coverUrl: string;
  trackCount: number;
}
