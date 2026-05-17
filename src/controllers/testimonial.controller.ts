import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createTestimonial, deleteTestimonial, listAdminTestimonials, listTestimonials, updateTestimonial } from '../services/testimonial.service';

export const testimonialsController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await listTestimonials() });
});

export const adminTestimonialsController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await listAdminTestimonials() });
});

export const createTestimonialController = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ ok: true, data: await createTestimonial(req.body) });
});

export const updateTestimonialController = asyncHandler(async (req: Request, res: Response) => {
  res.json({ ok: true, data: await updateTestimonial(String(req.params.id), req.body) });
});

export const deleteTestimonialController = asyncHandler(async (req: Request, res: Response) => {
  await deleteTestimonial(String(req.params.id));
  res.status(204).send();
});
