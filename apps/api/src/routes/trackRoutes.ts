import { Router } from 'express';
import { trackController } from '../controllers/trackController';

const router = Router();

router.get('/', (req, res, next) => trackController.getTracks(req, res, next));
router.get('/:id', (req, res, next) => trackController.getTrackById(req, res, next));
router.get('/:id/lyrics', (req, res, next) => trackController.getTrackLyrics(req, res, next));
router.post('/:id/like', (req, res, next) => trackController.toggleLike(req, res, next));

export const trackRoutes = router;
