import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { uploadImageController } from '../controllers/upload.controller';
import { HttpError } from '../utils/httpError';

const router = Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

const uploadSingleImage = (req: any, res: any, next: any) => {
  upload.single('image')(req, res, (error: unknown) => {
    if (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      return next(new HttpError(400, message));
    }
    next();
  });
};

router.post('/image', authenticate, uploadSingleImage, uploadImageController);

export default router;
