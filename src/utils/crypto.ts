import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export const hashValue = async (value: string) => bcrypt.hash(value, 10);
export const compareValue = async (value: string, hash: string) => bcrypt.compare(value, hash);
export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
export const generateOtp = () => String(crypto.randomInt(100000, 1000000));
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
