import { z } from "zod";

const colorSchema = z.string().regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, {
  message: "Cor deve estar no formato hexadecimal, ex: #3B82F6",
});

export const boardIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createBoardSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
  color: colorSchema.optional(),
});

export const updateBoardSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(1000).nullable().optional(),
    color: colorSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado",
  });

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
