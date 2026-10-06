import { Router } from 'express';
import { streamController } from '../controllers/streamController';
import { audioStreamLimiter } from '../middleware';

const router = Router();

// Apply streaming rate limiter to GET and HEAD requests
router.get('/:trackId', audioStreamLimiter, (req, res, next) =>
  streamController.streamTrack(req, res, next)
);

router.head('/:trackId', audioStreamLimiter, (req, res, next) =>
  streamController.streamTrack(req, res, next)
);

export const streamRoutes = router;
