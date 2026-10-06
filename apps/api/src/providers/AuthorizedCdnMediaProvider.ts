import crypto from 'crypto';
import { IMediaProvider, MediaProviderCapabilities, MediaProviderType, StreamQuality, StreamSource } from '@music/shared';
import { config } from '../config';

export class AuthorizedCdnMediaProvider implements IMediaProvider {
  readonly id = 'provider-authorized-cdn';
  readonly name = 'Authorized Media CDN Provider';
  readonly type: MediaProviderType = 'cdn';
  readonly capabilities: MediaProviderCapabilities = {
    canStream: true,
    canPreload: true,
    supportsRangeRequests: true,
    supportsOfflineDownload: true,
    hasLyrics: true
  };

  private baseUrl: string;
  private tokenSecret: string;

  constructor() {
    this.baseUrl = config.cdn.baseUrl;
    this.tokenSecret = config.cdn.tokenSecret;
  }

  async getStreamSource(trackId: string, quality: StreamQuality = 'high'): Promise<StreamSource> {
    // Generate secure time-limited token for CDN authentication
    const expiresAtTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const signature = crypto
      .createHmac('sha256', this.tokenSecret)
      .update(`${trackId}:${quality}:${expiresAtTimestamp}`)
      .digest('hex');

    const cdnUrl = `${this.baseUrl}/${trackId}/${quality}.mp3?exp=${expiresAtTimestamp}&sig=${signature}`;

    return {
      url: cdnUrl,
      mimeType: 'audio/mpeg',
      expiresAt: new Date(expiresAtTimestamp * 1000).toISOString(),
      isDirectStream: true
    };
  }

  async getLyrics(trackId: string): Promise<string | null> {
    return null;
  }
}
