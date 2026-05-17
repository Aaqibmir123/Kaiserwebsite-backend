import { Router } from 'express';
import { z } from 'zod';
import { authLimiter } from '../middlewares/rateLimit';
import { validate } from '../middlewares/validate';
import { adminLoginController, meController, refreshController, requestOtpController, updateMeController, verifyOtpController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

const requestOtpSchema = z.object({
  phone: z.string().min(8),
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  purpose: z.enum(['SIGN_IN', 'SIGN_UP']).optional()
});

const verifyOtpSchema = z.object({
  phone: z.string().min(8),
  code: z.string().length(6)
});

const adminLoginSchema = z.object({
  phone: z.string().min(8),
  password: z.string().min(4)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  avatarUrl: z.string().url().optional()
});

router.post('/request-otp', authLimiter, validate({ body: requestOtpSchema }), requestOtpController);
router.post('/verify-otp', authLimiter, validate({ body: verifyOtpSchema }), verifyOtpController);
router.post('/admin-login', authLimiter, validate({ body: adminLoginSchema }), adminLoginController);
router.post('/refresh', authLimiter, validate({ body: refreshSchema }), refreshController);
router.get('/me', authenticate, meController);
router.patch('/me', authenticate, validate({ body: updateMeSchema }), updateMeController);

export default router;
