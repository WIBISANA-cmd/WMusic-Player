import {
  MediaProviderCapabilities,
  MediaProviderMetadata,
  MediaProviderType,
  ProviderSearchOptions,
  StreamFormat,
  StreamInfo,
  StreamQuality,
  Track
} from '@music/shared';

export interface AudioMetadataResult {
  size: number;
  mimeType: StreamFormat;
  format?: string;
  duration?: number;
  isSeekable: boolean;
}

/**
 * Standard backend MediaProvider interface.
 * Implemented by LocalMediaProvider, S3MediaProvider, and AuthorizedCdnMediaProvider.
 */
export interface MediaProvider {
  readonly id: string;
  readonly name: string;
  readonly type: MediaProviderType;
  readonly capabilities: MediaProviderCapabilities;

  search(query: string, options?: ProviderSearchOptions): Promise<Track[]>;
  getTrack(trackId: string): Promise<Track | null>;
  resolvePlayback(trackId: string, quality?: StreamQuality): Promise<StreamInfo>;
  getStreamInfo(trackId: string): Promise<StreamInfo>;
  getAudioMetadata(trackId: string): Promise<AudioMetadataResult | null>;
  createAudioStream(
    trackId: string,
    range?: { start: number; end: number }
  ): Promise<NodeJS.ReadableStream | null>;
  getLyrics?(trackId: string): Promise<string | null>;
  getSignedPlaybackUrl?(trackId: string): Promise<string | null>;
}

export type {
  MediaProviderCapabilities,
  MediaProviderMetadata,
  MediaProviderType,
  ProviderSearchOptions,
  StreamFormat,
  StreamInfo,
  StreamQuality,
  Track
};
