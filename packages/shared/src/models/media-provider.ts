import { z } from 'zod';

export type MediaProviderType = 'local' | 's3' | 'cdn' | 'youtube_official' | 'custom';

export type StreamFormat = 'audio/mpeg' | 'audio/ogg' | 'audio/wav' | 'audio/flac' | 'audio/aac';

export type StreamQuality = 'standard' | 'high' | 'lossless';

export interface StreamSource {
  url: string;
  mimeType: StreamFormat;
  headers?: Record<string, string>;
  duration?: number;
  bitrate?: number;
  expiresAt?: string;
  isDirectStream?: boolean;
}

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

/**
 * MediaProvider abstraction contract.
 * Native HTML5 audio and external consumers rely purely on this contract,
 * keeping the player decoupled from storage backends, authorized CDNs, or future official players.
 */
export interface IMediaProvider {
  readonly id: string;
  readonly name: string;
  readonly type: MediaProviderType;
  readonly capabilities: MediaProviderCapabilities;

  /**
   * Resolves the streamable URL or stream manifest for the given track.
   */
  getStreamSource(trackId: string, quality?: StreamQuality): Promise<StreamSource>;

  /**
   * Optional lyrics retrieval hook provided by the provider.
   */
  getLyrics?(trackId: string): Promise<string | null>;
}

export const StreamQualitySchema = z.enum(['standard', 'high', 'lossless']);
export const MediaProviderTypeSchema = z.enum(['local', 's3', 'cdn', 'youtube_official', 'custom']);
