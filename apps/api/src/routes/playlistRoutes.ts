import { Router } from 'express';
import { playlistController } from '../controllers/playlistController';

const router = Router();

router.get('/', (req, res, next) => playlistController.getPlaylists(req, res, next));
router.get('/:id', (req, res, next) => playlistController.getPlaylistById(req, res, next));
router.post('/', (req, res, next) => playlistController.createPlaylist(req, res, next));
router.patch('/:id', (req, res, next) => playlistController.updatePlaylist(req, res, next));
router.post('/:id/tracks', (req, res, next) => playlistController.addTrackToPlaylist(req, res, next));
router.delete('/:id/tracks/:trackId', (req, res, next) =>
  playlistController.removeTrackFromPlaylist(req, res, next)
);

export const playlistRoutes = router;
