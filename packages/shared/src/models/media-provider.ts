import { z } from 'zod';
import { Track } from './track';

export type MediaProviderType = 'local' | 's3' | 'cdn' | 'youtube_official' | 'audius' | 'custom';

export type StreamFormat = 'audio/mpeg' | 'audio/ogg' | 'audio/wav' | 'audio/flac' | 'audio/aac';

export type StreamQuality = 'standard' | 'high' | 'lossless';

export interface StreamInfo {
  url: string;
  mimeType: StreamFormat;
  format?: string;
  duration?: number;
  bitrate?: number;
  headers?: Record<string, string>;
  expiresAt?: string;
  isDirectStream?: boolean;
}

export const StreamInfoSchema = z.object({
  url: z.string().min(1),
  mimeType: z.enum(['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac']),
  format: z.string().optional(),
  duration: z.number().optional(),
  bitrate: z.number().optional(),
  headers: z.record(z.string()).optional(),
  expiresAt: z.string().optional(),
  isDirectStream: z.boolean().optional()
});

export interface MediaProviderCapabilities {
  canStream: boolean;
  canPreload: boolean;
  supportsRangeRequests: boolean;
  supportsOfflineDownload: boolean;
  hasLyrics: boolean;
}

export interface MediaProviderMetadata {
  id: string;
  name: string;
  type: MediaProviderType;
  description: string;
  capabilities: MediaProviderCapabilities;
  isConfigured: boolean;
}

export interface ProviderSearchOptions {
  limit?: number;
  offset?: number;
  genre?: string;
}

/**
 * Standard MediaProvider interface.
 * All media streaming providers (local disk, S3/R2 object storage, signed CDNs,
 * or future official APIs) must implement this contract.
 * Provider-specific response structures are strictly normalized into standard Track/StreamInfo models.
 */
export interface MediaProvider {
  readonly id: string;
  readonly name: string;
  readonly type: MediaProviderType;
  readonly capabilities: MediaProviderCapabilities;

  /**
   * Search for tracks matching a text query.
   */
  search(query: string, options?: ProviderSearchOptions): Promise<Track[]>;

  /**
   * Retrieve normalized track metadata by ID.
   */
  getTrack(trackId: string): Promise<Track | null>;

  /**
   * Resolve playback source URL and stream headers for audio engine consumption.
   */
  resolvePlayback(trackId: string, quality?: StreamQuality): Promise<StreamInfo>;

  /**
   * Retrieve stream information (bitrate, codec, duration, mimeType) for a track.
   */
  getStreamInfo(trackId: string): Promise<StreamInfo>;

  /**
   * Optional synchronized lyrics retrieval hook.
   */
  getLyrics?(trackId: string): Promise<string | null>;
}

// Backwards compatibility alias
export type IMediaProvider = MediaProvider;
export type StreamSource = StreamInfo;

export const StreamQualitySchema = z.enum(['standard', 'high', 'lossless']);
export const MediaProviderTypeSchema = z.enum(['local', 's3', 'cdn', 'youtube_official', 'audius', 'custom']);
