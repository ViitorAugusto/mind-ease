import { z } from "zod";

export const taskIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateTaskSchema = z
  .object({
    boardId: z.string().uuid().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado",
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
