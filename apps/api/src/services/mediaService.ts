import { Track } from '@music/shared';
import { MediaProvider } from '../providers/media-provider';
import { mediaProviderRegistry } from '../providers/MediaProviderRegistry';
import { localMediaProvider } from '../providers/local-media-provider';
import { logger } from '../utils/logger';

export interface StreamResolution {
  type: 'stream' | 'redirect';
  status: 200 | 206 | 416;
  redirectUrl?: string;
  headers: Record<string, string | number>;
  stream?: NodeJS.ReadableStream;
}

export class MediaService {
  private getActiveProvider(): MediaProvider {
    return mediaProviderRegistry.getActiveProvider() || localMediaProvider;
  }

  /**
   * Search tracks across authorized media providers.
   * Returns normalized Track objects.
   */
  async searchTracks(query: string, limit: number = 20): Promise<{ tracks: Track[]; total: number }> {
    const provider = this.getActiveProvider();
    const tracks = await provider.search(query, { limit });
    return {
      tracks,
      total: tracks.length
    };
  }

  /**
   * Retrieve normalized track by ID.
   */
  async getTrackById(trackId: string): Promise<Track | null> {
    const provider = this.getActiveProvider();
    return provider.getTrack(trackId);
  }

  /**
   * Retrieve all normalized tracks from active catalog.
   */
  async getAllTracks(): Promise<Track[]> {
    const provider = this.getActiveProvider();
    return provider.search('', { limit: 100 });
  }

  /**
   * Retrieve track lyrics.
   */
  async getLyrics(trackId: string): Promise<string | null> {
    const provider = this.getActiveProvider();
    if (provider.getLyrics) {
      return provider.getLyrics(trackId);
    }
    return null;
  }

  /**
   * Retrieve audio stream metadata (file size, MIME type, seekability).
   */
  async getAudioMetadata(trackId: string) {
    const provider = this.getActiveProvider();
    return provider.getAudioMetadata(trackId);
  }

  /**
   * Resolve authorized audio stream with full HTTP 206 byte-range parsing.
   * Supports normal GET, Range requests, HEAD, and direct signed URL redirection.
   */
  async resolveStream(
    trackId: string,
    rangeHeader?: string,
    method: 'GET' | 'HEAD' = 'GET'
  ): Promise<StreamResolution | null> {
    const provider = this.getActiveProvider();

    // 1. Check if provider supports direct signed object storage URL (e.g. S3 / R2 signed URLs)
    if (provider.getSignedPlaybackUrl) {
      const signedUrl = await provider.getSignedPlaybackUrl(trackId);
      if (signedUrl) {
        return {
          type: 'redirect',
          status: 200,
          redirectUrl: signedUrl,
          headers: {
            Location: signedUrl
          }
        };
      }
    }

    // 2. Fetch media file metadata
    const metadata = await provider.getAudioMetadata(trackId);
    if (!metadata) {
      return null;
    }

    const { size: totalSize, mimeType } = metadata;
    const baseHeaders: Record<string, string | number> = {
      'Accept-Ranges': 'bytes',
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
    };

    // 3. Handle Range Requests (HTTP 206 or 416)
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const rawRange = rangeHeader.replace(/^bytes=/i, '').trim();
      const firstRange = rawRange.split(',')[0].trim();

      let start = 0;
      let end = totalSize - 1;
      let isRangeValid = true;

      if (firstRange.startsWith('-')) {
        // Suffix range e.g. "-500" -> last 500 bytes
        const suffixLength = parseInt(firstRange.substring(1), 10);
        if (isNaN(suffixLength) || suffixLength <= 0) {
          isRangeValid = false;
        } else {
          const effectiveSuffix = Math.min(suffixLength, totalSize);
          start = totalSize - effectiveSuffix;
          end = totalSize - 1;
        }
      } else {
        const parts = firstRange.split('-');
        start = parseInt(parts[0], 10);

        if (isNaN(start) || start < 0 || start >= totalSize) {
          isRangeValid = false;
        } else if (parts[1] && parts[1].trim() !== '') {
          end = parseInt(parts[1], 10);
          if (isNaN(end) || end < start) {
            isRangeValid = false;
          } else if (end >= totalSize) {
            end = totalSize - 1;
          }
        } else {
          end = totalSize - 1;
        }
      }

      // If range is invalid, return HTTP 416 Range Not Satisfiable
      if (!isRangeValid) {
        logger.warn('Invalid byte range requested', { trackId, rangeHeader, totalSize });
        return {
          type: 'stream',
          status: 416,
          headers: {
            ...baseHeaders,
            'Content-Range': `bytes */${totalSize}`
          }
        };
      }

      // Range is valid: HTTP 206 Partial Content
      const chunkSize = end - start + 1;
      const rangeHeaders: Record<string, string | number> = {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Length': chunkSize
      };

      if (method === 'HEAD') {
        return {
          type: 'stream',
          status: 206,
          headers: rangeHeaders
        };
      }

      const stream = await provider.createAudioStream(trackId, { start, end });
      if (!stream) {
        return null;
      }

      return {
        type: 'stream',
        status: 206,
        headers: rangeHeaders,
        stream
      };
    }

    // 4. Normal Full Content Request (HTTP 200 OK)
    const fullHeaders: Record<string, string | number> = {
      ...baseHeaders,
      'Content-Length': totalSize
    };

    if (method === 'HEAD') {
      return {
        type: 'stream',
        status: 200,
        headers: fullHeaders
      };
    }

    const stream = await provider.createAudioStream(trackId);
    if (!stream) {
      return null;
    }

    return {
      type: 'stream',
      status: 200,
      headers: fullHeaders,
      stream
    };
  }
}

export const mediaService = new MediaService();
