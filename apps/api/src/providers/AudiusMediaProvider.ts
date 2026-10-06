import {
  MediaProviderCapabilities,
  MediaProviderType,
  ProviderSearchOptions,
  StreamInfo,
  StreamQuality,
  Track
} from '@music/shared';
import { MediaProvider, AudioMetadataResult } from './media-provider';
import { logger } from '../utils/logger';

interface CacheEntry {
  timestamp: number;
  data: Track[];
}

export class AudiusMediaProvider implements MediaProvider {
  readonly id = 'audius';
  readonly name = 'Audius Open Audio';
  readonly type: MediaProviderType = 'audius';

  readonly capabilities: MediaProviderCapabilities = {
    canStream: true,
    canPreload: true,
    supportsRangeRequests: true,
    supportsOfflineDownload: true,
    hasLyrics: false
  };

  private searchCache = new Map<string, CacheEntry>();
  private trackCache = new Map<string, Track>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
  private readonly APP_NAME = 'pulse_music';
  private readonly BASE_API = 'https://api.audius.co';

  /**
   * Search tracks on Audius open decentralized audio network.
   * 100% legal, ad-free streaming with direct MP3 endpoints.
   */
  async search(query: string, options?: ProviderSearchOptions): Promise<Track[]> {
    const trimmed = query.trim();
    const limit = Math.min(options?.limit || 20, 50);

    const cacheKey = `${trimmed.toLowerCase()}_${limit}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = trimmed
        ? `${this.BASE_API}/v1/tracks/search?query=${encodeURIComponent(trimmed)}&app_name=${this.APP_NAME}`
        : `${this.BASE_API}/v1/tracks/trending?app_name=${this.APP_NAME}`;

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        logger.warn('Audius API returned non-OK status', { status: res.status, query: trimmed });
        return [];
      }

      const json = (await res.json()) as { data?: any[] };
      const rawTracks = json.data || [];

      const tracks: Track[] = [];

      for (const item of rawTracks) {
        if (tracks.length >= limit) break;
        if (!item || !item.id || !item.title) continue;

        const normalized = this.normalizeTrack(item);
        tracks.push(normalized);
        this.trackCache.set(normalized.id, normalized);
        this.trackCache.set(String(item.id), normalized);
      }

      this.searchCache.set(cacheKey, {
        timestamp: Date.now(),
        data: tracks
      });

      return tracks;
    } catch (err) {
      logger.error('Audius search error', { query: trimmed, error: String(err) });
      return [];
    }
  }

  /**
   * Retrieve normalized track by Audius ID.
   */
  async getTrack(trackId: string): Promise<Track | null> {
    const cleanId = trackId.replace(/^audius-/, '').trim();
    if (!cleanId) return null;

    if (this.trackCache.has(trackId)) {
      return this.trackCache.get(trackId)!;
    }
    if (this.trackCache.has(cleanId)) {
      return this.trackCache.get(cleanId)!;
    }

    try {
      const url = `${this.BASE_API}/v1/tracks/${encodeURIComponent(cleanId)}?app_name=${this.APP_NAME}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        return null;
      }

      const json = (await res.json()) as { data?: any };
      if (!json.data) return null;

      const track = this.normalizeTrack(json.data);
      this.trackCache.set(track.id, track);
      this.trackCache.set(cleanId, track);
      return track;
    } catch (err) {
      logger.warn('Failed to retrieve track from Audius', { cleanId, error: String(err) });
      return null;
    }
  }

  /**
   * Resolve playback stream URL.
   */
  async resolvePlayback(trackId: string, _quality?: StreamQuality): Promise<StreamInfo> {
    const cleanId = trackId.replace(/^audius-/, '').trim();
    const streamUrl = `${this.BASE_API}/v1/tracks/${encodeURIComponent(cleanId)}/stream?app_name=${this.APP_NAME}`;
    return {
      url: streamUrl,
      mimeType: 'audio/mpeg',
      format: 'mp3',
      isDirectStream: true
    };
  }

  async getStreamInfo(trackId: string): Promise<StreamInfo> {
    return this.resolvePlayback(trackId);
  }

  /**
   * Audius stream URL allows direct 302 redirection.
   */
  async getSignedPlaybackUrl(trackId: string): Promise<string | null> {
    const cleanId = trackId.replace(/^audius-/, '').trim();
    return `${this.BASE_API}/v1/tracks/${encodeURIComponent(cleanId)}/stream?app_name=${this.APP_NAME}`;
  }

  async getAudioMetadata(_trackId: string): Promise<AudioMetadataResult | null> {
    // Return standard seekable MP3 metadata; direct streaming handled via redirect or fetch
    return {
      size: 8000000,
      mimeType: 'audio/mpeg',
      format: 'mp3',
      isSeekable: true
    };
  }

  async createAudioStream(
    trackId: string,
    range?: { start: number; end: number }
  ): Promise<NodeJS.ReadableStream | null> {
    const cleanId = trackId.replace(/^audius-/, '').trim();
    const streamUrl = `${this.BASE_API}/v1/tracks/${encodeURIComponent(cleanId)}/stream?app_name=${this.APP_NAME}`;

    const headers: Record<string, string> = {};
    if (range) {
      headers['Range'] = `bytes=${range.start}-${range.end}`;
    }

    try {
      const res = await fetch(streamUrl, {
        headers,
        redirect: 'follow'
      });

      if (!res.ok || !res.body) {
        return null;
      }

      // Convert Web ReadableStream to Node.js Readable stream
      const { Readable } = await import('stream');
      return Readable.fromWeb(res.body as any);
    } catch (err) {
      logger.error('Failed to proxy Audius audio stream', { trackId, error: String(err) });
      return null;
    }
  }

  private normalizeTrack(item: any): Track {
    const cleanId = String(item.id);
    const artworkUrl =
      item.artwork?.['480x480'] ||
      item.artwork?.['150x150'] ||
      item.artwork?.['1000x1000'] ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';

    return {
      id: `audius-${cleanId}`,
      provider: 'audius',
      title: item.title || 'Audius Track',
      artist: item.user?.name || item.user?.handle || 'Audius Artist',
      album: item.genre ? `${item.genre} • Audius` : 'Audius Open Audio',
      duration: Math.round(item.duration || 180),
      artwork: [
        {
          url: artworkUrl,
          width: 480,
          height: 480
        }
      ],
      playable: true,
      explicit: false,
      audioUrl: `${this.BASE_API}/v1/tracks/${cleanId}/stream?app_name=${this.APP_NAME}`,
      genre: item.genre || 'Electronic',
      metadata: {
        audiusId: cleanId,
        repostCount: item.repost_count,
        favoriteCount: item.favorite_count,
        permalink: item.permalink,
        isAdFree: true
      }
    };
  }
}

export const audiusMediaProvider = new AudiusMediaProvider();

