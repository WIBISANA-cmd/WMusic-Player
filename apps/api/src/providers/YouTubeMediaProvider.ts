import {
  MediaProviderCapabilities,
  MediaProviderType,
  ProviderSearchOptions,
  StreamInfo,
  StreamQuality,
  Track
} from '@music/shared';
import { MediaProvider, AudioMetadataResult } from './media-provider';
import { config } from '../config';
import { logger } from '../utils/logger';

interface CacheEntry {
  timestamp: number;
  data: Track[];
}

export class YouTubeMediaProvider implements MediaProvider {
  readonly id = 'youtube';
  readonly name = 'YouTube Official';
  readonly type: MediaProviderType = 'youtube_official';

  readonly capabilities: MediaProviderCapabilities = {
    canStream: true,
    canPreload: false,
    supportsRangeRequests: false,
    supportsOfflineDownload: false,
    hasLyrics: false
  };

  private searchCache = new Map<string, CacheEntry>();
  private trackCache = new Map<string, Track>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

  /**
   * Search YouTube for tracks and videos matching query.
   * Utilizes YouTube Data API v3 when API key is configured,
   * or parses public metadata as fallback.
   */
  async search(query: string, options?: ProviderSearchOptions): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const limit = Math.min(options?.limit || 20, 50);
    const cacheKey = `${trimmed.toLowerCase()}_${limit}`;
    const cached = this.searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      let tracks: Track[] = [];

      // 1. Try YouTube Data API v3 if configured
      if (config.youtube?.apiKey) {
        try {
          tracks = await this.searchViaDataApi(trimmed, limit);
        } catch (apiErr) {
          logger.warn('YouTube Data API failed, falling back to public catalog search', { error: String(apiErr) });
        }
      }

      // 2. Fallback to public metadata search
      if (tracks.length === 0) {
        tracks = await this.searchViaPublicCatalog(trimmed, limit);
      }

      // Populate track cache
      for (const t of tracks) {
        this.trackCache.set(t.id, t);
        const rawId = (t.metadata?.videoId as string) || t.id.replace(/^yt-/, '');
        this.trackCache.set(rawId, t);
      }

      this.searchCache.set(cacheKey, {
        timestamp: Date.now(),
        data: tracks
      });

      return tracks;
    } catch (err) {
      logger.error('YouTube search encountered an error', { query: trimmed, error: String(err) });
      return [];
    }
  }

  /**
   * Retrieve normalized track by YouTube video ID.
   */
  async getTrack(trackId: string): Promise<Track | null> {
    const videoId = trackId.replace(/^yt-/, '').trim();
    if (!videoId) return null;

    if (this.trackCache.has(videoId)) {
      return this.trackCache.get(videoId)!;
    }
    if (this.trackCache.has(`yt-${videoId}`)) {
      return this.trackCache.get(`yt-${videoId}`)!;
    }

    try {
      // Fetch video details via official oEmbed endpoint (no API key required)
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(
        videoId
      )}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PulseMusic/1.0)' }
      });

      if (!res.ok) {
        return null;
      }

      const info = (await res.json()) as {
        title: string;
        author_name: string;
        thumbnail_url?: string;
      };

      const track: Track = {
        id: `yt-${videoId}`,
        provider: 'youtube',
        title: this.cleanHtmlEntities(info.title),
        artist: this.cleanHtmlEntities(info.author_name),
        album: 'YouTube Music',
        duration: 210, // Default estimated duration if oEmbed doesn't include it
        artwork: [
          {
            url: info.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            width: 480,
            height: 360
          }
        ],
        playable: true,
        explicit: false,
        metadata: {
          videoId,
          channelTitle: info.author_name,
          isYouTubeVideo: true
        }
      };

      this.trackCache.set(track.id, track);
      this.trackCache.set(videoId, track);
      return track;
    } catch (err) {
      logger.warn('Failed to resolve YouTube track via oEmbed', { videoId, error: String(err) });
      return null;
    }
  }

  /**
   * YouTube tracks are streamed exclusively via the official YouTube IFrame Player
   * on the client. Returns official embed and watch URLs for metadata.
   */
  async resolvePlayback(trackId: string, _quality?: StreamQuality): Promise<StreamInfo> {
    const videoId = trackId.replace(/^yt-/, '');
    return {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      mimeType: 'audio/mpeg',
      format: 'youtube_iframe',
      isDirectStream: false
    };
  }

  async getStreamInfo(trackId: string): Promise<StreamInfo> {
    return this.resolvePlayback(trackId);
  }

  async getAudioMetadata(_trackId: string): Promise<AudioMetadataResult | null> {
    // YouTube tracks are not streamed as raw byte-range audio files
    return null;
  }

  async createAudioStream(
    _trackId: string,
    _range?: { start: number; end: number }
  ): Promise<NodeJS.ReadableStream | null> {
    // Prohibited by policy: raw YouTube audio scraping/streaming is disallowed
    return null;
  }

  // ================= PRIVATE HELPERS =================

  private async searchViaDataApi(query: string, limit: number): Promise<Track[]> {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoCategoryId', '10'); // Music category
    url.searchParams.set('maxResults', String(limit));
    url.searchParams.set('q', query);
    url.searchParams.set('key', config.youtube.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`YouTube API returned status ${res.status}`);
    }

    const data = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: {
            high?: { url: string };
            default?: { url: string };
          };
        };
      }>;
    };

    const tracks: Track[] = [];
    for (const item of data.items || []) {
      const videoId = item.id?.videoId;
      if (!videoId) continue;

      const title = this.cleanHtmlEntities(item.snippet?.title || 'YouTube Track');
      const artist = this.cleanHtmlEntities(item.snippet?.channelTitle || 'YouTube');
      const thumb =
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      tracks.push({
        id: `yt-${videoId}`,
        provider: 'youtube',
        title,
        artist,
        album: 'YouTube Music',
        duration: 210,
        artwork: [{ url: thumb, width: 480, height: 360 }],
        playable: true,
        explicit: false,
        metadata: {
          videoId,
          channelTitle: artist,
          isYouTubeVideo: true
        }
      });
    }

    return tracks;
  }

  private async searchViaPublicCatalog(query: string, limit: number): Promise<Track[]> {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
      }
    });

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const match =
      html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/);

    if (!match) {
      return [];
    }

    const data = JSON.parse(match[1]);
    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

    const tracks: Track[] = [];

    for (const section of contents || []) {
      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        if (tracks.length >= limit) break;

        const v = item.videoRenderer;
        if (!v || !v.videoId) continue;

        const videoId = v.videoId;
        const titleRaw = v.title?.runs?.[0]?.text || v.title?.simpleText || 'YouTube Video';
        const artistRaw =
          v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'YouTube Creator';
        const durationText = v.lengthText?.simpleText;
        const duration = this.parseDurationToSeconds(durationText);

        const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        tracks.push({
          id: `yt-${videoId}`,
          provider: 'youtube',
          title: this.cleanHtmlEntities(titleRaw),
          artist: this.cleanHtmlEntities(artistRaw),
          album: 'YouTube Music',
          duration,
          artwork: [{ url: thumb, width: 480, height: 360 }],
          playable: true,
          explicit: false,
          metadata: {
            videoId,
            channelTitle: artistRaw,
            isYouTubeVideo: true
          }
        });
      }
    }

    return tracks;
  }

  private parseDurationToSeconds(durationStr?: string): number {
    if (!durationStr) return 210;
    const parts = durationStr.split(/[:.]/).map((p) => parseInt(p.trim(), 10));
    if (parts.some(isNaN)) return 210;

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return 210;
  }

  private cleanHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}

export const youTubeMediaProvider = new YouTubeMediaProvider();

