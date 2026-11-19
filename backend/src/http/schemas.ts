import { z } from 'zod';
export const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  displayName: z.string().trim().min(2).max(32),
  password: z.string().min(8).max(128).refine((value) => value.trim().length > 0, 'Password cannot be only whitespace.'),
});
export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});
export const progressSchema = z.object({ levelId: z.number().int().positive(), percent: z.number().int().min(1).max(99) });
export const completionSchema = z.object({ levelId: z.number().int().positive(), videoUrl: z.string().url().nullable().optional() });
export const levelQuerySchema = z.object({
  zone: z.string().default('all'), q: z.string().optional(), difficulty: z.string().optional(), length: z.string().optional(),
  status: z.enum(['completed', 'in-progress']).optional(), playerId: z.string().optional(), sort: z.string().default('global'),
  page: z.coerce.number().int().min(1).default(1), perPage: z.coerce.number().int().min(1).max(100).default(50),
});
export const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), perPage: z.coerce.number().int().min(1).max(100).default(50) });
