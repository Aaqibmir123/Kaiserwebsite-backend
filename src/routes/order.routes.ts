import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { checkoutController, listOrdersController, orderController } from '../controllers/order.controller';

const router = Router();

const checkoutSchema = z.object({
  paymentMethod: z.string().min(2),
  addressId: z.string().optional(),
  couponCode: z.string().trim().max(32).optional()
});

router.post('/checkout', authenticate, validate({ body: checkoutSchema }), checkoutController);
router.get('/', authenticate, listOrdersController);
router.get('/:id', authenticate, orderController);

export default router;
