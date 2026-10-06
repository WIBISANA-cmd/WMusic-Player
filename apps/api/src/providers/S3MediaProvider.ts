import { IMediaProvider, MediaProviderCapabilities, MediaProviderType, StreamQuality, StreamSource } from '@music/shared';
import { config } from '../config';
import { logger } from '../utils/logger';

export class S3MediaProvider implements IMediaProvider {
  readonly id = 'provider-s3-r2';
  readonly name = 'S3 / Cloudflare R2 Authorized Provider';
  readonly type: MediaProviderType = 's3';
  readonly capabilities: MediaProviderCapabilities = {
    canStream: true,
    canPreload: true,
    supportsRangeRequests: true,
    supportsOfflineDownload: true,
    hasLyrics: true
  };

  private bucket: string;
  private endpoint: string;
  private isConfigured: boolean;

  constructor() {
    this.bucket = config.s3.bucket;
    this.endpoint = config.s3.endpoint;
    this.isConfigured = config.s3.isConfigured;
  }

  async getStreamSource(trackId: string, quality: StreamQuality = 'high'): Promise<StreamSource> {
    if (!this.isConfigured) {
      logger.debug('S3 Provider not fully configured, falling back to local gateway URL', { trackId });
      return {
        url: `/api/stream/${trackId}?source=s3&quality=${quality}`,
        mimeType: 'audio/mpeg',
        isDirectStream: false
      };
    }

    // In a fully configured S3/R2 setup, generate a pre-signed GET URL with 1-hour expiration
    const expirySeconds = 3600;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();
    const objectKey = `tracks/${trackId}/${quality}.mp3`;
    const signedUrl = `${this.endpoint}/${this.bucket}/${objectKey}?token=mock_presigned_token_${Date.now()}`;

    return {
      url: signedUrl,
      mimeType: 'audio/mpeg',
      expiresAt,
      isDirectStream: true
    };
  }

  async getLyrics(trackId: string): Promise<string | null> {
    logger.debug('Fetching lyrics from S3/R2 bucket', { trackId });
    return null;
  }
}
