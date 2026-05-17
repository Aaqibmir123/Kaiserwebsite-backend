import { SupportThreadStatus, UserRole } from '@prisma/client';

import { db } from '../db';
import { HttpError } from '../utils/httpError';

const WELCOME_MESSAGE =
  'Thanks for contacting Shopora Support. Share your order number, store name, or any screenshot and we will help you here.';

const messageSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  threadId: true,
  senderId: true,
  senderRole: true,
  senderName: true,
  message: true,
  attachmentUrl: true,
  isSystem: true
} as const;

const userPreviewSelect = {
  id: true,
  name: true,
  phone: true,
  avatarUrl: true,
  role: true
} as const;

const threadWithMessagesInclude = {
  user: { select: userPreviewSelect },
  assignedAdmin: { select: userPreviewSelect },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      ...messageSelect
    }
  }
} as const;

const threadSummaryInclude = {
  user: { select: userPreviewSelect },
  assignedAdmin: { select: userPreviewSelect },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: {
      ...messageSelect
    }
  }
} as const;

const buildFallbackSubject = (userName?: string | null) => {
  const trimmed = userName?.trim();
  return trimmed ? `Support request from ${trimmed}` : 'Support request';
};

const getThreadById = (threadId: string) =>
  db.supportThread.findUnique({
    where: { id: threadId },
    include: threadWithMessagesInclude
  });

const ensureSupportThread = async (userId: string) => {
  const existing = await db.supportThread.findFirst({
    where: { userId },
    orderBy: { lastMessageAt: 'desc' },
    include: threadWithMessagesInclude
  });

  if (existing) return existing;

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!user) throw new HttpError(404, 'User not found');

  return db.$transaction(async (tx) => {
    const thread = await tx.supportThread.create({
      data: {
        userId,
        subject: buildFallbackSubject(user.name),
        status: SupportThreadStatus.OPEN
      }
    });

    await tx.supportMessage.create({
      data: {
        threadId: thread.id,
        senderId: null,
        senderRole: UserRole.ADMIN,
        senderName: 'Shopora Support',
        message: WELCOME_MESSAGE,
        isSystem: true
      }
    });

    return tx.supportThread.findUnique({
      where: { id: thread.id },
      include: threadWithMessagesInclude
    });
  });
};

const touchThread = async (threadId: string, status?: SupportThreadStatus) => {
  await db.supportThread.update({
    where: { id: threadId },
    data: {
      ...(status ? { status } : {}),
      lastMessageAt: new Date()
    }
  });
};

export const getMySupportThread = async (userId: string) => {
  const thread = await ensureSupportThread(userId);
  if (!thread) throw new HttpError(404, 'Support thread not found');
  return thread;
};

export const getMySupportMessages = async (userId: string) => {
  const thread = await ensureSupportThread(userId);
  if (!thread) throw new HttpError(404, 'Support thread not found');
  return thread;
};

export const sendMySupportMessage = async (
  userId: string,
  senderRole: UserRole,
  input: { message: string; attachmentUrl?: string | null }
) => {
  const thread = await ensureSupportThread(userId);
  if (!thread) throw new HttpError(404, 'Support thread not found');

  const createdMessage = await db.supportMessage.create({
    data: {
      threadId: thread.id,
      senderId: userId,
      senderRole,
      senderName: thread.user.name ?? 'Customer',
      message: input.message?.trim() || '',
      attachmentUrl: input.attachmentUrl?.trim() || null,
      isSystem: false
    } as any,
    select: messageSelect
  });

  await touchThread(thread.id, SupportThreadStatus.OPEN);

  return {
    threadId: thread.id,
    message: createdMessage
  };
};

export const listAdminSupportThreads = async () =>
  db.supportThread.findMany({
    orderBy: { lastMessageAt: 'desc' },
    include: {
      ...threadSummaryInclude
    }
  });

export const getAdminSupportThread = async (threadId: string) => {
  const thread = await getThreadById(threadId);
  if (!thread) throw new HttpError(404, 'Support thread not found');
  return thread;
};

export const sendAdminSupportMessage = async (
  adminId: string,
  threadId: string,
  input: { message: string; attachmentUrl?: string | null }
) => {
  const admin = await db.user.findUnique({
    where: { id: adminId },
    select: { id: true, name: true, role: true }
  });
  if (!admin || admin.role !== UserRole.ADMIN) throw new HttpError(403, 'Forbidden');

  const thread = await db.supportThread.findUnique({
    where: { id: threadId },
    select: { id: true, userId: true }
  });
  if (!thread) throw new HttpError(404, 'Support thread not found');

  const createdMessage = await db.supportMessage.create({
    data: {
      threadId,
      senderId: adminId,
      senderRole: UserRole.ADMIN,
      senderName: admin.name ?? 'Shopora Support',
      message: input.message?.trim() || '',
      attachmentUrl: input.attachmentUrl?.trim() || null,
      isSystem: false
    } as any,
    select: messageSelect
  });

  await db.supportThread.update({
    where: { id: threadId },
    data: {
      status: SupportThreadStatus.OPEN,
      assignedAdminId: adminId,
      lastMessageAt: new Date()
    }
  });

  return {
    threadId,
    message: createdMessage
  };
};

export const updateSupportThreadStatus = async (adminId: string, threadId: string, status: SupportThreadStatus) => {
  const admin = await db.user.findUnique({ where: { id: adminId }, select: { id: true, role: true } });
  if (!admin || admin.role !== UserRole.ADMIN) throw new HttpError(403, 'Forbidden');

  const thread = await db.supportThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new HttpError(404, 'Support thread not found');

  return db.supportThread.update({
    where: { id: threadId },
    data: {
      status,
      assignedAdminId: thread.assignedAdminId ?? adminId,
      lastMessageAt: new Date()
    },
    include: threadWithMessagesInclude
  });
};

export const getSupportThreadSummary = async (userId: string) => {
  const thread = await ensureSupportThread(userId);
  if (!thread) throw new HttpError(404, 'Support thread not found');
  return thread;
};
