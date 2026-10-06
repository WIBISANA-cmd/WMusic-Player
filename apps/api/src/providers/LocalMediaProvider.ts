import fs from 'fs';
import path from 'path';
import { IMediaProvider, MediaProviderCapabilities, MediaProviderType, StreamQuality, StreamSource } from '@music/shared';
import { config } from '../config';
import { logger } from '../utils/logger';

export class LocalMediaProvider implements IMediaProvider {
  readonly id = 'provider-local-storage';
  readonly name = 'Local Authorized Storage Provider';
  readonly type: MediaProviderType = 'local';
  readonly capabilities: MediaProviderCapabilities = {
    canStream: true,
    canPreload: true,
    supportsRangeRequests: true,
    supportsOfflineDownload: true,
    hasLyrics: true
  };

  private storageDir: string;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || config.mediaStoragePath;
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
        logger.info('Initialized local media directory', { path: this.storageDir });
      } catch (err) {
        logger.error('Failed to create local media directory', err, { path: this.storageDir });
      }
    }
  }

  getFilePath(trackId: string): string | null {
    const candidates = [
      path.join(this.storageDir, `${trackId}.mp3`),
      path.join(this.storageDir, `${trackId}.wav`),
      path.join(this.storageDir, `${trackId}.flac`),
      path.join(this.storageDir, `${trackId}.ogg`)
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  async getStreamSource(trackId: string, quality: StreamQuality = 'high'): Promise<StreamSource> {
    const filePath = this.getFilePath(trackId);
    let mimeType: StreamSource['mimeType'] = 'audio/mpeg';

    if (filePath) {
      if (filePath.endsWith('.wav')) mimeType = 'audio/wav';
      else if (filePath.endsWith('.flac')) mimeType = 'audio/flac';
      else if (filePath.endsWith('.ogg')) mimeType = 'audio/ogg';
    }

    // Direct endpoint on our API supporting HTTP Range streaming
    const streamUrl = `/api/stream/${trackId}?quality=${quality}`;

    return {
      url: streamUrl,
      mimeType,
      isDirectStream: true,
      headers: {
        'Accept-Ranges': 'bytes'
      }
    };
  }

  async getLyrics(trackId: string): Promise<string | null> {
    const lrcPath = path.join(this.storageDir, `${trackId}.lrc`);
    if (fs.existsSync(lrcPath)) {
      try {
        return await fs.promises.readFile(lrcPath, 'utf-8');
      } catch (err) {
        logger.warn('Failed reading lrc file', { trackId, err });
      }
    }
    return null;
  }
}
