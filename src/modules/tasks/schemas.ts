import { z } from "zod";

const checklistItemSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().min(1).max(500),
  isConcluded: z.boolean(),
});

export const taskIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const taskColumnIdParamSchema = z.object({
  columnId: z.string().uuid(),
});

export const createTaskSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  checklist: z.array(checklistItemSchema).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  hours: z.number().min(0).optional(),
});

export const updateTaskSchema = z
  .object({
    columnId: z.string().uuid().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    checklist: z.array(checklistItemSchema).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    hours: z.number().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado",
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
