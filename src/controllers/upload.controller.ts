import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { uploadImageToCloudinary } from '../services/cloudinary.service';

export const uploadImageController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new HttpError(400, 'Image file is required');

  const uploaded = await uploadImageToCloudinary(req.file);
  console.log('[upload] image uploaded', {
    publicId: uploaded.publicId,
    mimeType: req.file.mimetype,
    size: req.file.size,
    userId: req.user?.id ?? null,
    role: req.user?.role ?? null
  });
  res.status(201).json({
    ok: true,
    data: {
      filename: uploaded.publicId || req.file.originalname,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      bytes: uploaded.bytes,
      format: uploaded.format
    }
  });
});
