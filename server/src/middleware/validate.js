import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

// Runs a Zod schema against req.body, replaces it with the parsed/trimmed
// result, and turns any failure into a clean 400. Centralizing validation here
// keeps controllers focused on behavior, not shape-checking.
export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const msg = result.error.issues.map((i) => i.message).join('; ');
      return next(new ApiError(400, msg));
    }
    req.body = result.data;
    next();
  };
}

const trimmed = (max, label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long (max ${max})`);

// Optional reorder inputs shared by list/card updates.
const reorder = {
  position: z.number().optional(),
  before: z.number().optional(),
  after: z.number().optional(),
};

export const schemas = {
  register: z.object({
    name: trimmed(80, 'name'),
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: z.string().min(6, 'password must be at least 6 characters').max(200),
  }),
  login: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: z.string().min(1, 'password is required'),
  }),
  createBoard: z.object({ title: trimmed(120, 'title') }),
  updateBoard: z.object({ title: trimmed(120, 'title').optional() }),
  addMember: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email'),
    role: z.enum(['owner', 'member']).optional(),
  }),
  createList: z.object({ title: trimmed(120, 'title') }),
  updateList: z.object({ title: trimmed(120, 'title').optional(), ...reorder }),
  createCard: z.object({
    title: trimmed(280, 'title'),
    description: z.string().max(5000).optional(),
  }),
  updateCard: z.object({
    title: trimmed(280, 'title').optional(),
    description: z.string().max(5000).optional(),
    list: z.string().optional(),
    version: z.number().int().nonnegative().optional(),
    ...reorder,
  }),
};
