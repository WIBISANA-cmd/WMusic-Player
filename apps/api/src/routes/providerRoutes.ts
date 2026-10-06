import { Router } from 'express';
import { providerController } from '../controllers/providerController';

const router = Router();

router.get('/', (req, res, next) => providerController.getProviders(req, res, next));

export const providerRoutes = router;
