import { OtpPurpose, UserRole } from '@prisma/client';
import { db } from '../db';
import { HttpError } from '../utils/httpError';
import { generateOtp, sha256 } from '../utils/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';

const OTP_TTL_MINUTES = 10;
const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(-10);
const OWNER_NAME = 'Qaiser Ahmad Mir';

export const requestOtp = async (input: { phone: string; email?: string; name?: string; purpose?: OtpPurpose }) => {
  const phone = normalizePhone(input.phone);
  const purpose = input.purpose ?? OtpPurpose.SIGN_IN;
  const code = generateOtp();
  const codeHash = sha256(code);
  const isAdminPhone = normalizePhone(phone) === normalizePhone(env.adminLoginPhone);
  console.log('[auth] normalized request-otp phone:', phone, 'admin:', isAdminPhone);

  await db.otpCode.updateMany({
    where: {
      phone,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });

  const user = await db.user.upsert({
    where: { phone },
    update: {
      ...(input.email ? { email: input.email } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(isAdminPhone ? { role: UserRole.ADMIN } : {})
    },
    create: {
      phone,
      email: input.email,
      name: input.name,
      role: isAdminPhone ? UserRole.ADMIN : UserRole.SHOPPER
    }
  });

  const otp = await db.otpCode.create({
    data: {
      phone,
      userId: user.id,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000)
    }
  });

  if (env.nodeEnv !== 'production') {
    console.log(`[otp] ${phone} -> ${code}`);
  }

  return {
    phone,
    purpose,
    devOtp: code,
    expiresAt: otp.expiresAt.toISOString()
  };
};

export const verifyOtp = async (input: { phone: string; code: string }) => {
  const phone = normalizePhone(input.phone);
  const code = String(input.code).replace(/\D/g, '').slice(0, 6);
  console.log('[auth] normalized verify-otp phone:', phone, 'code:', code);
  const otpRecords = await db.otpCode.findMany({
    where: {
      phone,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (otpRecords.length === 0) throw new HttpError(400, 'OTP expired or missing');

  const otp = otpRecords.find((record) => sha256(code.trim()) === record.codeHash);
  if (!otp) {
    const latest = otpRecords[0];
    if (latest.attempts >= 5) throw new HttpError(429, 'Too many attempts');

    await db.otpCode.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } }
    });

    console.log('[auth] verify-otp mismatch details:', {
      phone,
      providedCode: code,
      latestOtpId: latest.id,
      latestAttempts: latest.attempts + 1,
      latestExpiresAt: latest.expiresAt.toISOString()
    });
    throw new HttpError(400, 'Invalid OTP');
  }

  await db.otpCode.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 }, consumedAt: new Date() }
  });

  const user = otp.userId
    ? await db.user.findUnique({ where: { id: otp.userId } })
    : await db.user.findUnique({ where: { phone } });
  if (!user) throw new HttpError(404, 'User not found');

  const finalUser = normalizePhone(user.phone ?? phone) === normalizePhone(env.adminLoginPhone)
    ? await db.user.update({
        where: { id: user.id },
        data: { role: UserRole.ADMIN, isActive: true, name: user.name ?? OWNER_NAME }
      })
    : user;

  const token = signAccessToken({ sub: finalUser.id, role: finalUser.role });
  const refreshToken = signRefreshToken({ sub: finalUser.id, role: finalUser.role });
  return { token, refreshToken, user: finalUser };
};

export const adminLogin = async (input: { phone: string; password: string }) => {
  const phone = normalizePhone(input.phone);
  if (!env.adminLoginPhone || !env.adminLoginPassword) {
    throw new HttpError(500, 'Admin credentials are not configured');
  }
  if (phone !== normalizePhone(env.adminLoginPhone) || input.password.trim() !== env.adminLoginPassword) {
    throw new HttpError(401, 'Invalid admin credentials');
  }

  const admin = await db.user.upsert({
    where: { phone },
    update: { role: UserRole.ADMIN, isActive: true, name: OWNER_NAME },
    create: {
      phone,
      role: UserRole.ADMIN,
      name: OWNER_NAME,
      isActive: true
    }
  });

  const token = signAccessToken({ sub: admin.id, role: admin.role });
  const refreshToken = signRefreshToken({ sub: admin.id, role: admin.role });
  return { token, refreshToken, user: admin };
};

export const refreshSession = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await db.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new HttpError(404, 'User not found');

  const token = signAccessToken({ sub: user.id, role: user.role });
  const nextRefreshToken = signRefreshToken({ sub: user.id, role: user.role });
  return { token, refreshToken: nextRefreshToken, user };
};

export const getCurrentUser = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      store: true,
      addresses: true,
      favorites: true,
      cartItems: true
    }
  });
  if (!user) throw new HttpError(404, 'User not found');
  return user;
};

export const updateCurrentUser = async (
  userId: string,
  input: { name?: string; email?: string; phone?: string; avatarUrl?: string }
) => {
  const nextPhone = input.phone ? normalizePhone(input.phone) : undefined;
  const nextEmail = input.email?.trim() ? input.email.trim().toLowerCase() : undefined;
  const nextName = input.name?.trim() ? input.name.trim() : undefined;
  const nextAvatarUrl = input.avatarUrl?.trim() ? input.avatarUrl.trim() : undefined;

  if (nextPhone) {
    const existingPhone = await db.user.findFirst({
      where: {
        phone: nextPhone,
        id: { not: userId }
      }
    });
    if (existingPhone) {
      throw new HttpError(409, 'Phone number is already in use');
    }
  }

  if (nextEmail) {
    const existingEmail = await db.user.findFirst({
      where: {
        email: nextEmail,
        id: { not: userId }
      }
    });
    if (existingEmail) {
      throw new HttpError(409, 'Email is already in use');
    }
  }

  return db.user.update({
    where: { id: userId },
    data: {
      ...(nextName ? { name: nextName } : {}),
      ...(nextEmail ? { email: nextEmail } : {}),
      ...(nextPhone ? { phone: nextPhone } : {}),
      ...(nextAvatarUrl ? { avatarUrl: nextAvatarUrl } : {})
    },
    include: {
      store: true,
      addresses: true
    }
  });
};
