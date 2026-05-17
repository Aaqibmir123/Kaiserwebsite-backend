import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { validate } from '../middlewares/validate';
import { categoriesController, createProductController, deleteProductController, productController, productsController, updateProductController } from '../controllers/catalog.controller';
import { ProductStatus, UserRole } from '@prisma/client';

const router = Router();

router.get('/categories', categoriesController);
router.get('/products', productsController);
router.get('/products/:slug', productController);

const createProductSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  mrp: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().url(),
  categorySlug: z.string().min(2),
  brand: z.string().optional()
});

const updateProductSchema = createProductSchema.partial().extend({
  status: z.nativeEnum(ProductStatus).optional()
});

router.post('/products', authenticate, requireRole(UserRole.ADMIN, UserRole.SELLER), validate({ body: createProductSchema }), createProductController);
router.patch('/products/:id', authenticate, requireRole(UserRole.ADMIN, UserRole.SELLER), validate({ body: updateProductSchema }), updateProductController);
router.delete('/products/:id', authenticate, requireRole(UserRole.ADMIN, UserRole.SELLER), deleteProductController);

export default router;
