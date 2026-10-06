import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { LocalMediaProvider } from '../providers/LocalMediaProvider';
import { mediaProviderRegistry } from '../providers/MediaProviderRegistry';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

export class StreamController {
  /**
   * High-reliability audio streaming endpoint with full HTTP 206 Partial Content (Range) support.
   * This is critical for HTML5 Audio scrubbing, seeking, buffering, and low-latency mobile playback.
   */
  async streamTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trackId } = req.params;
      const localProvider = mediaProviderRegistry.getProvider('provider-local-storage') as LocalMediaProvider;
      const filePath = localProvider.getFilePath(trackId);

      if (!filePath || !fs.existsSync(filePath)) {
        throw new AppError(404, `Audio file for track '${trackId}' not found on storage`, 'TRACK_NOT_FOUND');
      }

      const stat = await fs.promises.stat(filePath);
      const fileSize = stat.size;
      const ext = path.extname(filePath).toLowerCase();

      let contentType = 'audio/mpeg';
      if (ext === '.wav') contentType = 'audio/wav';
      else if (ext === '.ogg') contentType = 'audio/ogg';
      else if (ext === '.flac') contentType = 'audio/flac';

      const range = req.headers.range;

      if (range) {
        // Range header e.g. "bytes=0-1048576"
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
          res.setHeader('Content-Range', `bytes */${fileSize}`);
          res.status(416).send('Requested range not satisfiable');
          return;
        }

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
        });

        fileStream.on('error', (streamErr) => {
          logger.error('Audio stream pipe error', streamErr, { trackId, start, end });
          if (!res.headersSent) {
            res.status(500).end();
          }
        });

        fileStream.pipe(res);
      } else {
        // Entire file stream
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
        });

        fs.createReadStream(filePath).pipe(res);
      }
    } catch (err) {
      next(err);
    }
  }
}

export const streamController = new StreamController();
