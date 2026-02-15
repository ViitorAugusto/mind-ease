import { z } from "zod";

export const boardIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateBoardSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(1000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado",
  });

export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
