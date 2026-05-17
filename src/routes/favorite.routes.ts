import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { listFavoritesController, toggleFavoriteController } from '../controllers/favorite.controller';

const router = Router();

router.get('/', authenticate, listFavoritesController);
router.post('/:productId', authenticate, toggleFavoriteController);
router.delete('/:productId', authenticate, toggleFavoriteController);

export default router;
