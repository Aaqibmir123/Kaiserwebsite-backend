import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { validate } from '../middlewares/validate';
import { applySellerController, createSellerProductController, editSellerProductController, removeSellerProductController, sellerApplicationStatusController, sellerDashboardController, sellerEarningsController, sellerInventoryController, sellerOrdersController, sellerProductsController, sellerStoreController, updateSellerOrderController, updateSellerStoreController } from '../controllers/seller.controller';
import { OrderStatus, UserRole } from '@prisma/client';

const router = Router();

const sellerProductSchema = z.object({
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

router.post('/apply', authenticate, validate({
  body: z.object({
    storeName: z.string().min(2),
    category: z.string().min(2),
    gstNumber: z.string().optional(),
    bankLast4: z.string().min(4).max(4).optional(),
    aadhaarFrontUrl: z.string().url().optional(),
    aadhaarBackUrl: z.string().url().optional(),
    panCardUrl: z.string().url().optional(),
    gstCertificateUrl: z.string().url().optional(),
    bankProofUrl: z.string().url().optional(),
    addressProofUrl: z.string().url().optional(),
    note: z.string().optional()
  })
}), applySellerController);
router.get('/dashboard', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), sellerDashboardController);
router.get('/products', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), sellerProductsController);
router.get('/inventory', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), sellerInventoryController);
router.get('/orders', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), sellerOrdersController);
router.get('/earnings', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), sellerEarningsController);
router.get('/application', authenticate, sellerApplicationStatusController);
router.get('/store', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), sellerStoreController);
router.patch('/store', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), validate({ body: z.object({ name: z.string().min(2).optional(), slug: z.string().min(2).optional(), description: z.string().optional(), logoUrl: z.string().url().optional(), coverUrl: z.string().url().optional(), phone: z.string().min(8).optional(), email: z.string().email().optional(), address: z.string().min(5).optional(), isOpen: z.boolean().optional() }) }), updateSellerStoreController);
router.post('/products', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), validate({ body: sellerProductSchema }), createSellerProductController);
router.patch('/products/:id', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), validate({ body: sellerProductSchema.partial() }), editSellerProductController);
router.delete('/products/:id', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), removeSellerProductController);
router.patch('/orders/:id', authenticate, requireRole(UserRole.SELLER, UserRole.ADMIN), validate({ body: z.object({ status: z.nativeEnum(OrderStatus) }) }), updateSellerOrderController);

export default router;
