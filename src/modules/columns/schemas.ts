import { z } from "zod";

export const columnIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const columnSlugParamSchema = z.object({
  slug: z.string().min(1).max(140),
});

export const createColumnSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1).max(120),
});

export const updateColumnSchema = z
  .object({
    boardId: z.string().uuid().optional(),
    name: z.string().min(1).max(120).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado",
  });

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
