import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { validate } from '../middlewares/validate';
import {
  createReturnRequestController,
  getMyReturnRequestController,
  listMyReturnRequestsController,
  reviewReturnRequestController
} from '../controllers/return.controller';
import { ReturnRequestStatus, ReturnRequestType, UserRole } from '@prisma/client';

const router = Router();

router.get('/me', authenticate, listMyReturnRequestsController);
router.get('/me/:id', authenticate, getMyReturnRequestController);
router.post(
  '/',
  authenticate,
  validate({
    body: z.object({
      orderId: z.string().min(1),
      orderItemId: z.string().optional(),
      type: z.nativeEnum(ReturnRequestType),
      reason: z.string().min(5),
      comments: z.string().optional(),
      photoUrls: z.array(z.string().url()).optional()
    })
  }),
  createReturnRequestController
);
router.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.SELLER, UserRole.ADMIN),
  validate({
    body: z.object({
      status: z.nativeEnum(ReturnRequestStatus),
      resolutionNote: z.string().optional()
    })
  }),
  reviewReturnRequestController
);

export default router;
