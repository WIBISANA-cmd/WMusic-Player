import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { ensureAudioAssets } from './services/audioGenerator';
import { mockTracks } from './data/mockTracks';

async function bootstrap() {
  try {
    // Generate valid synthesized audio files if not present in media storage
    logger.info('Verifying media catalog audio assets...', { path: config.mediaStoragePath });
    ensureAudioAssets(config.mediaStoragePath, mockTracks);

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`🎵 Music API Server running on http://localhost:${config.port}`, {
        port: config.port,
        env: config.env,
        healthCheck: `http://localhost:${config.port}/health`
      });
    });

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Gracefully terminating server...`);
      server.close(() => {
        logger.info('HTTP server closed cleanly.');
        process.exit(0);
      });

      // Force shutdown after 10s if dangling connections remain
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

bootstrap();
