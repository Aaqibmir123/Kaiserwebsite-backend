import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'ADMIN_LOGIN_PHONE', 'ADMIN_LOGIN_PASSWORD'] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_ACCESS_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:8081,http://localhost:19006').split(',').map((s) => s.trim()),
  adminLoginPhone: process.env.ADMIN_LOGIN_PHONE as string,
  adminLoginPassword: process.env.ADMIN_LOGIN_PASSWORD as string,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  cloudinaryUploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'kasierwebsitee'
};
