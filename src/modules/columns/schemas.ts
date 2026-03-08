import { z } from "zod";

const colorSchema = z.string().regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, {
  message: "Cor deve estar no formato hexadecimal, ex: #3B82F6",
});

export const columnIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const columnSlugParamSchema = z.object({
  slug: z.string().min(1).max(140),
});

export const columnBoardIdParamSchema = z.object({
  boardId: z.string().uuid(),
});

export const createColumnSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1).max(120),
  color: colorSchema.optional(),
});

export const updateColumnSchema = z
  .object({
    boardId: z.string().uuid().optional(),
    name: z.string().min(1).max(120).optional(),
    color: colorSchema.optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado",
  });

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
