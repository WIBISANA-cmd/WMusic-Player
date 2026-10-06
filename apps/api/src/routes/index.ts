import { Router } from 'express';
import { trackRoutes } from './trackRoutes';
import { streamRoutes } from './streamRoutes';
import { playlistRoutes } from './playlistRoutes';
import { searchRoutes } from './searchRoutes';
import { genreRoutes } from './genreRoutes';
import { providerRoutes } from './providerRoutes';
import { healthRoutes } from './healthRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/tracks', trackRoutes);
router.use('/stream', streamRoutes);
router.use('/playlists', playlistRoutes);
router.use('/search', searchRoutes);
router.use('/genres', genreRoutes);
router.use('/providers', providerRoutes);

export const apiRoutes = router;
