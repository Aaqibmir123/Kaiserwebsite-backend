import { Router } from 'express';
import { z } from 'zod';
import { SupportThreadStatus, UserRole } from '@prisma/client';

import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { validate } from '../middlewares/validate';
import {
  adminSupportThreadController,
  adminSupportThreadsController,
  mySupportMessagesController,
  mySupportThreadController,
  sendAdminSupportMessageController,
  sendMySupportMessageController,
  updateAdminSupportThreadController
} from '../controllers/support.controller';

const router = Router();

router.use(authenticate);

const messageSchema = z.object({
  message: z.string().trim().max(2000).optional().default(''),
  attachmentUrl: z.string().url().optional().nullable()
}).refine((value) => Boolean(value.message.trim()) || Boolean(value.attachmentUrl), {
  message: 'Add a message or attach an image'
});

router.get('/me', mySupportThreadController);
router.get('/me/messages', mySupportMessagesController);
router.post('/me/messages', validate({ body: messageSchema }), sendMySupportMessageController);

router.get('/admin/threads', requireRole(UserRole.ADMIN), adminSupportThreadsController);
router.get('/admin/threads/:id/messages', requireRole(UserRole.ADMIN), adminSupportThreadController);
router.post('/admin/threads/:id/messages', requireRole(UserRole.ADMIN), validate({ body: messageSchema }), sendAdminSupportMessageController);
router.patch(
  '/admin/threads/:id',
  requireRole(UserRole.ADMIN),
  validate({
    body: z.object({
      status: z.nativeEnum(SupportThreadStatus)
    })
  }),
  updateAdminSupportThreadController
);

export default router;
