import { Router } from 'express';
import { streamController } from '../controllers/streamController';
import { audioStreamLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Apply streaming rate limiter
router.get('/:trackId', audioStreamLimiter, (req, res, next) =>
  streamController.streamTrack(req, res, next)
);

export const streamRoutes = router;
