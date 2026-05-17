import crypto from 'node:crypto';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  url: string;
  resource_type: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  original_filename?: string;
};

const buildSignature = (timestamp: number, folder: string) => {
  const payload = `folder=${folder}&timestamp=${timestamp}`;
  return crypto.createHash('sha1').update(`${payload}${env.cloudinaryApiSecret}`).digest('hex');
};

export const uploadImageToCloudinary = async (file: Express.Multer.File) => {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new HttpError(500, 'Cloudinary is not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = env.cloudinaryUploadFolder;
  const signature = buildSignature(timestamp, folder);
  const fileData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

  const form = new FormData();
  form.append('file', fileData);
  form.append('api_key', env.cloudinaryApiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`, {
    method: 'POST',
    body: form
  });

  const raw = await response.text();
  let parsed: Partial<CloudinaryUploadResponse> & { error?: { message?: string } } = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Partial<CloudinaryUploadResponse> & { error?: { message?: string } };
    } catch {
      parsed = {} as Partial<CloudinaryUploadResponse> & { error?: { message?: string } };
    }
  }

  if (!response.ok) {
    throw new HttpError(response.status, parsed.error?.message ?? 'Cloudinary upload failed');
  }

  if (!parsed.secure_url) {
    throw new HttpError(502, 'Cloudinary response missing secure URL');
  }

  return {
    publicId: parsed.public_id ?? '',
    url: parsed.secure_url,
    width: parsed.width ?? null,
    height: parsed.height ?? null,
    bytes: parsed.bytes ?? null,
    format: parsed.format ?? null,
    originalFilename: parsed.original_filename ?? file.originalname
  };
};
