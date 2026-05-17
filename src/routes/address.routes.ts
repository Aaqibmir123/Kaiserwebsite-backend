import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { deleteAddressController, listAddressesController, saveAddressController } from '../controllers/address.controller';

const router = Router();

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(2),
  name: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().optional(),
  isDefault: z.boolean().optional()
});

router.get('/', authenticate, listAddressesController);
router.post('/', authenticate, validate({ body: addressSchema }), saveAddressController);
router.patch('/:id', authenticate, validate({ body: addressSchema.partial() }), saveAddressController);
router.delete('/:id', authenticate, deleteAddressController);

export default router;
