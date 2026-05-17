import { db } from '../db';
import { cache } from '../utils/cache';
import { HttpError } from '../utils/httpError';

const testimonialSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  clientName: true,
  feedback: true,
  rating: true,
  photoUrl: true,
  location: true,
  purchaseDate: true,
  sortOrder: true,
  isActive: true
} as const;

export const listTestimonials = async () =>
  db.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
    select: testimonialSelect
  });

export const listAdminTestimonials = async () =>
  db.testimonial.findMany({
    orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
    select: testimonialSelect
  });

export const createTestimonial = async (input: {
  clientName: string;
  feedback: string;
  rating: number;
  photoUrl?: string;
  location?: string;
  purchaseDate?: string;
  sortOrder?: number;
  isActive?: boolean;
}) =>
  db.testimonial.create({
    data: {
      clientName: input.clientName.trim(),
      feedback: input.feedback.trim(),
      rating: input.rating,
      photoUrl: input.photoUrl?.trim() || null,
      location: input.location?.trim() || null,
      purchaseDate: input.purchaseDate?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true
    },
    select: testimonialSelect
  }).finally(() => cache.clear());

export const updateTestimonial = async (
  id: string,
  input: Partial<{
    clientName: string;
    feedback: string;
    rating: number;
    photoUrl: string;
    location: string;
    purchaseDate: string;
    sortOrder: number;
    isActive: boolean;
  }>
) => {
  const existing = await db.testimonial.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Testimonial not found');

  return db.testimonial.update({
    where: { id },
    data: {
      ...(input.clientName !== undefined ? { clientName: input.clientName.trim() } : {}),
      ...(input.feedback !== undefined ? { feedback: input.feedback.trim() } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl.trim() || null } : {}),
      ...(input.location !== undefined ? { location: input.location.trim() || null } : {}),
      ...(input.purchaseDate !== undefined ? { purchaseDate: input.purchaseDate.trim() || null } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
    },
    select: testimonialSelect
  }).finally(() => cache.clear());
};

export const deleteTestimonial = async (id: string) => {
  const existing = await db.testimonial.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Testimonial not found');
  return db.testimonial.delete({ where: { id } }).finally(() => cache.clear());
};
