import { z } from 'zod';

export const testimonialIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const testimonialBaseSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  feedback: z.string().min(10, 'Feedback should be at least 10 characters'),
  rating: z.coerce.number().int().min(1).max(5),
  photoUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().min(2).optional().or(z.literal('')),
  purchaseDate: z.string().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional()
});

export const createTestimonialSchema = testimonialBaseSchema;
export const updateTestimonialSchema = testimonialBaseSchema.partial();
