import { Router } from 'express';
import { testimonialsController } from '../controllers/testimonial.controller';

const router = Router();

router.get('/', testimonialsController);

export default router;
