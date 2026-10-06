import fs from 'fs';
import path from 'path';
import {
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

  public getFilePath(trackId: string): string | null {
    const extensions = ['.mp3', '.wav', '.flac', '.ogg'];
    for (const ext of extensions) {
      const fullPath = path.join(this.storageDir, `${trackId}${ext}`);
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
      url: `/api/stream/${trackId}?quality=${quality}`
    };
  }

  /**
   * Inspect audio format, bitrate, and duration from stored file.
   */
  async getStreamInfo(trackId: string): Promise<StreamInfo> {
    const filePath = this.getFilePath(trackId);
    let mimeType: StreamFormat = 'audio/mpeg';
    let format = 'mp3';

    if (filePath) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.wav') {
        mimeType = 'audio/wav';
        format = 'wav';
      } else if (ext === '.flac') {
        mimeType = 'audio/flac';
        format = 'flac';
      } else if (ext === '.ogg') {
        mimeType = 'audio/ogg';
        format = 'ogg';
      }
    }

    const track = await this.getTrack(trackId);

    return {
      url: `/api/stream/${trackId}`,
      mimeType,
      format,
      duration: track?.duration || 0,
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
    // Check .lrc file in storage dir
    const lrcPath = path.join(this.storageDir, `${trackId}.lrc`);
    if (fs.existsSync(lrcPath)) {
      try {
        return await fs.promises.readFile(lrcPath, 'utf-8');
      } catch (err) {
        logger.warn('Failed reading lrc file', { trackId, err });
      }
    }

    // Check mock lyrics record
    if (mockLyricsRecord[trackId]) {
      return mockLyricsRecord[trackId];
    }

    return null;
  }
}

export const localMediaProvider = new LocalMediaProvider();

