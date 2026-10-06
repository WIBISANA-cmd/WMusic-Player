import { z } from 'zod';

export interface Artwork {
  url: string;
  width?: number;
  height?: number;
}

export const ArtworkSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
});

/**
 * Normalized Track model.
 * Does not contain provider-specific hard-coded concepts (e.g. videoId).
 * Any provider-specific identifiers are isolated within `metadata`.
 */
export interface Track {
  id: string;
  provider: string; // Identifier of the MediaProvider (e.g. 'local', 's3', 'authorized_cdn')
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  artwork: Artwork[];
  playable: boolean;
  explicit: boolean;
  metadata: Record<string, unknown>;
  audioUrl?: string; // Resolved direct stream endpoint when available
  genre?: string;
  bpm?: number;
  releaseYear?: number;
}

export const TrackSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().default(''),
  duration: z.number().nonnegative(),
  artwork: z.array(ArtworkSchema).default([]),
  playable: z.boolean().default(true),
  explicit: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
  audioUrl: z.string().optional(),
  genre: z.string().optional(),
  bpm: z.number().optional(),
  releaseYear: z.number().int().optional()
});

export type TrackInput = z.infer<typeof TrackSchema>;

export interface Artist {
  id: string;
  name: string;
  artwork?: Artwork[];
  coverUrl?: string;
  genres: string[];
  trackCount: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork?: Artwork[];
  coverUrl?: string;
  releaseYear: number;
  trackCount: number;
  totalDuration: number;
}

export interface GenreCategory {
  id: string;
  name: string;
  gradient: string;
  artwork?: Artwork[];
  coverUrl?: string;
  trackCount: number;
}
