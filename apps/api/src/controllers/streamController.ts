import { Request, Response, NextFunction } from 'express';
import { pipeline } from 'stream';
import path from 'path';
import { mediaService } from '../services/mediaService';
import { AppError } from '../middleware';
import { logger } from '../utils/logger';

export class StreamController {
  /**
   * High-reliability authorized audio streaming endpoint.
   * Full HTTP 206 Partial Content (Range) & HEAD request support.
   */
  async streamTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    const rawTrackId = req.params.trackId;

    if (!rawTrackId) {
      return next(new AppError(400, 'Track ID is required', 'INVALID_TRACK_ID'));
    }

    // SSRF & Path Traversal Prevention: Ensure track ID is safe
    const trackId = path.basename(rawTrackId.trim());
    if (trackId.includes('..') || trackId !== rawTrackId.trim()) {
      return next(new AppError(400, 'Invalid track ID format', 'INVALID_TRACK_ID'));
    }

    try {
      const method = (req.method.toUpperCase() === 'HEAD' ? 'HEAD' : 'GET') as 'GET' | 'HEAD';
      const rangeHeader = req.headers.range;

      const resolution = await mediaService.resolveStream(trackId, rangeHeader, method);

      if (!resolution) {
        throw new AppError(404, `Audio file for track '${trackId}' not found`, 'TRACK_NOT_FOUND');
      }

      // 1. Direct Signed URL Redirection Optimization
      if (resolution.type === 'redirect' && resolution.redirectUrl) {
        res.redirect(302, resolution.redirectUrl);
        return;
      }

      // Set headers from stream resolution
      for (const [headerName, headerValue] of Object.entries(resolution.headers)) {
        res.setHeader(headerName, headerValue);
      }

      // 2. HTTP 416 Range Not Satisfiable
      if (resolution.status === 416) {
        res.status(416).end('Requested range not satisfiable');
        return;
      }

      // 3. HEAD Request Handling (Send headers without body)
      if (method === 'HEAD') {
        res.status(resolution.status).end();
        return;
      }

      // 4. GET Stream Handling
      const stream = resolution.stream;
      if (!stream) {
        throw new AppError(500, 'Audio stream could not be initialized', 'STREAM_ERROR');
      }

      res.status(resolution.status);

      // Handle client cancellation / early disconnect
      let streamFinished = false;

      req.on('close', () => {
        if (!streamFinished && !res.writableEnded) {
          logger.debug('Audio stream aborted by client connection close', { trackId, ip: req.ip });
          if ('destroy' in stream && typeof stream.destroy === 'function') {
            stream.destroy();
          }
        }
      });

      stream.on('end', () => {
        streamFinished = true;
      });

      stream.on('error', (streamErr: any) => {
        if (streamErr?.code === 'ERR_STREAM_PREMATURE_CLOSE' || streamErr?.message === 'Premature close') {
          return;
        }
        logger.error('Audio stream source error', streamErr, { trackId });
        if (!res.headersSent) {
          next(streamErr);
        } else {
          res.destroy();
        }
      });

      // Stream data via Node pipeline to prevent resource leaks
      pipeline(stream, res, (pipelineErr) => {
        streamFinished = true;
        if (pipelineErr && pipelineErr.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
          logger.warn('Audio stream pipeline closed with error', {
            trackId,
            code: pipelineErr.code,
            message: pipelineErr.message
          });
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const streamController = new StreamController();
