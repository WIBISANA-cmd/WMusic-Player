import { Router } from 'express';
import { genreController } from '../controllers/genreController';

const router = Router();

router.get('/', (req, res, next) => genreController.getGenres(req, res, next));

export const genreRoutes = router;
