import { Router } from 'express';
import { searchController } from '../controllers/searchController';

const router = Router();

router.get('/', (req, res, next) => searchController.search(req, res, next));

export const searchRoutes = router;
