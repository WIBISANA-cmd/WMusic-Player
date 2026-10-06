import fs from 'fs';
import path from 'path';
import {
  AudioMetadataResult,
  MediaProvider,
  MediaProviderCapabilities,
  MediaProviderType,
  ProviderSearchOptions,
  StreamFormat,
  StreamInfo,
  StreamQuality,
  Track
} from './media-provider';
import { config } from '../config';
import { logger } from '../utils/logger';
import { mockTracks, mockLyricsRecord } from '../data/mockTracks';

export class LocalMediaProvider implements MediaProvider {
  readonly id = 'local-storage';
  readonly name = 'Local Media Storage';
  readonly type: MediaProviderType = 'local';
  readonly capabilities: MediaProviderCapabilities = {
    canStream: true,
    canPreload: true,
    supportsRangeRequests: true,
    supportsOfflineDownload: true,
    hasLyrics: true
  };

  private storageDir: string;
  private catalog: Track[];

  constructor(storageDir?: string) {
    this.storageDir = storageDir || config.mediaStoragePath;
    this.catalog = [...mockTracks];

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
        logger.info('Initialized local storage directory', { path: this.storageDir });
      } catch (err) {
        logger.error('Failed to create storage directory', err, { path: this.storageDir });
      }
    }
  }

  /**
   * Resolves safe local filesystem path for a track, guarding against path traversal.
   */
  public getFilePath(trackId: string): string | null {
    // Sanitize trackId against directory traversal
    const safeTrackId = path.basename(trackId);
    const extensions = ['.wav', '.mp3', '.flac', '.ogg', '.m4a'];

    for (const ext of extensions) {
      const fullPath = path.join(this.storageDir, `${safeTrackId}${ext}`);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }

  /**
   * Search tracks in the local catalog.
   */
  async search(query: string, options?: ProviderSearchOptions): Promise<Track[]> {
    const q = query.toLowerCase().trim();
    const limit = options?.limit || 20;

    const filtered = this.catalog.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q))
    );

    return filtered.slice(0, limit);
  }

  /**
   * Retrieve normalized track by ID.
   */
  async getTrack(trackId: string): Promise<Track | null> {
    const track = this.catalog.find((t) => t.id === trackId);
    return track ? { ...track } : null;
  }

  /**
   * Resolve playback stream URL and headers for the audio engine.
   */
  async resolvePlayback(trackId: string, quality: StreamQuality = 'high'): Promise<StreamInfo> {
    const streamInfo = await this.getStreamInfo(trackId);
    return {
      ...streamInfo,
      url: `/api/v1/stream/${encodeURIComponent(trackId)}?quality=${quality}`
    };
  }

  /**
   * Retrieve audio stream metadata (size, exact MIME type, seekability).
   */
  async getAudioMetadata(trackId: string): Promise<AudioMetadataResult | null> {
    const filePath = this.getFilePath(trackId);
    if (!filePath) {
      return null;
    }

    try {
      const stat = await fs.promises.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();

      let mimeType: StreamFormat = 'audio/mpeg';
      let format = 'mp3';

      if (ext === '.wav') {
        mimeType = 'audio/wav';
        format = 'wav';
      } else if (ext === '.ogg') {
        mimeType = 'audio/ogg';
        format = 'ogg';
      } else if (ext === '.flac') {
        mimeType = 'audio/flac';
        format = 'flac';
      } else if (ext === '.m4a' || ext === '.mp4') {
        mimeType = 'audio/aac';
        format = 'm4a';
      }

      const track = await this.getTrack(trackId);

      return {
        size: stat.size,
        mimeType,
        format,
        duration: track?.duration,
        isSeekable: true
      };
    } catch (err) {
      logger.error('Failed to read track metadata', err, { trackId, filePath });
      return null;
    }
  }

  /**
   * Create an authorized readable audio stream for the given byte range.
   */
  async createAudioStream(
    trackId: string,
    range?: { start: number; end: number }
  ): Promise<NodeJS.ReadableStream | null> {
    const filePath = this.getFilePath(trackId);
    if (!filePath) {
      return null;
    }

    try {
      if (range) {
        return fs.createReadStream(filePath, {
          start: range.start,
          end: range.end
        });
      }
      return fs.createReadStream(filePath);
    } catch (err) {
      logger.error('Failed creating audio read stream', err, { trackId, filePath, range });
      return null;
    }
  }

  /**
   * Inspect audio format, bitrate, and duration.
   */
  async getStreamInfo(trackId: string): Promise<StreamInfo> {
    const meta = await this.getAudioMetadata(trackId);
    const track = await this.getTrack(trackId);

    return {
      url: `/api/v1/stream/${encodeURIComponent(trackId)}`,
      mimeType: meta?.mimeType || 'audio/mpeg',
      format: meta?.format || 'mp3',
      duration: meta?.duration || track?.duration || 0,
      bitrate: 320000,
      isDirectStream: true,
      headers: {
        'Accept-Ranges': 'bytes'
      }
    };
  }

  /**
   * Optional lyrics retrieval hook.
   */
  async getLyrics(trackId: string): Promise<string | null> {
    const safeTrackId = path.basename(trackId);
    const lrcPath = path.join(this.storageDir, `${safeTrackId}.lrc`);
    if (fs.existsSync(lrcPath)) {
      try {
        return await fs.promises.readFile(lrcPath, 'utf-8');
      } catch (err) {
        logger.warn('Failed reading lrc file', { trackId, err });
      }
    }

    if (mockLyricsRecord[trackId]) {
      return mockLyricsRecord[trackId];
    }

    return null;
  }
}

export const localMediaProvider = new LocalMediaProvider();
