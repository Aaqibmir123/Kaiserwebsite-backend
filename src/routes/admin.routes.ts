import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { validate } from '../middlewares/validate';
import { adminDashboardController, ordersOverviewController, productModerationController, revenueAnalyticsController, reviewProductController, reviewSellerApprovalController, sellerApprovalsController, usersOverviewController } from '../controllers/admin.controller';
import { adminTestimonialsController, createTestimonialController, deleteTestimonialController, updateTestimonialController } from '../controllers/testimonial.controller';
import { createTestimonialSchema, testimonialIdParamsSchema, updateTestimonialSchema } from '../validators/testimonial';
import { StoreStatus, UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN));
router.get('/dashboard', adminDashboardController);
router.get('/seller-approvals', sellerApprovalsController);
router.patch('/seller-approvals/:id', validate({ body: z.object({ status: z.nativeEnum(StoreStatus), note: z.string().optional() }) }), reviewSellerApprovalController);
router.get('/users', usersOverviewController);
router.get('/orders', ordersOverviewController);
router.get('/products/moderation', productModerationController);
router.patch('/products/:id', validate({ body: z.object({ status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED', 'OUT_OF_STOCK', 'PENDING_REVIEW']) }) }), reviewProductController);
router.get('/revenue', revenueAnalyticsController);
router.get('/testimonials', adminTestimonialsController);
router.post('/testimonials', validate({ body: createTestimonialSchema }), createTestimonialController);
router.patch('/testimonials/:id', validate({ params: testimonialIdParamsSchema, body: updateTestimonialSchema }), updateTestimonialController);
router.delete('/testimonials/:id', validate({ params: testimonialIdParamsSchema }), deleteTestimonialController);

export default router;
