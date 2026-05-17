import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { clearCartController, getCartController, removeCartController, upsertCartController } from '../controllers/cart.controller';

const router = Router();

const upsertSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  selectedSize: z.string().optional(),
  selectedColor: z.string().optional()
});

router.get('/', authenticate, getCartController);
router.post('/items', authenticate, validate({ body: upsertSchema }), upsertCartController);
router.patch('/items/:productId', authenticate, validate({ body: upsertSchema.partial().required({ productId: true }) }), upsertCartController);
router.delete('/items/:productId', authenticate, removeCartController);
router.delete('/clear', authenticate, clearCartController);

export default router;
