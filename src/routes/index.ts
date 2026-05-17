import { Router } from 'express';
import authRoutes from './auth.routes';
import catalogRoutes from './catalog.routes';
import cartRoutes from './cart.routes';
import favoriteRoutes from './favorite.routes';
import addressRoutes from './address.routes';
import orderRoutes from './order.routes';
import returnRoutes from './return.routes';
import sellerRoutes from './seller.routes';
import adminRoutes from './admin.routes';
import supportRoutes from './support.routes';
import uploadRoutes from './upload.routes';
import testimonialsRoutes from './testimonials.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'shopora-api' }));
router.use('/auth', authRoutes);
router.use('/', catalogRoutes);
router.use('/cart', cartRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/returns', returnRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/support', supportRoutes);
router.use('/uploads', uploadRoutes);
router.use('/testimonials', testimonialsRoutes);

export default router;
