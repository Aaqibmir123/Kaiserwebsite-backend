import { db } from '../db';
import { HttpError } from '../utils/httpError';

export const listAddresses = (userId: string) => db.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });

export const upsertAddress = async (userId: string, input: {
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
  id?: string;
}) => {
  const existingCount = await db.address.count({ where: { userId } });
  const shouldBeDefault = input.isDefault ?? existingCount === 0;

  if (input.id) {
    const existing = await db.address.findFirst({ where: { id: input.id, userId } });
    if (!existing) throw new HttpError(404, 'Address not found');

    if (shouldBeDefault) {
      await db.address.updateMany({ where: { userId, NOT: { id: input.id } }, data: { isDefault: false } });
    }

    return db.address.update({
      where: { id: input.id },
      data: {
        country: input.country ?? 'India',
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
        ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        isDefault: shouldBeDefault
      }
    });
  }

  if (shouldBeDefault) {
    await db.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return db.address.create({
    data: {
      userId,
      label: input.label,
      name: input.name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country ?? 'India',
      isDefault: shouldBeDefault
    }
  });
};

export const deleteAddress = async (userId: string, id: string) => {
  const address = await db.address.findFirst({ where: { id, userId } });
  if (!address) throw new HttpError(404, 'Address not found');
  const deleted = await db.address.delete({ where: { id } });
  if (deleted.isDefault) {
    const fallback = await db.address.findFirst({ where: { userId }, orderBy: [{ createdAt: 'desc' }] });
    if (fallback) {
      await db.address.update({ where: { id: fallback.id }, data: { isDefault: true } });
    }
  }
  return deleted;
};

export const getDefaultAddress = async (userId: string) => {
  const address = await db.address.findFirst({ where: { userId, isDefault: true } });
  if (!address) throw new HttpError(404, 'Default address not found');
  return address;
};
