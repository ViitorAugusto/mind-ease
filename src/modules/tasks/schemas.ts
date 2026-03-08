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

export const taskBoardColumnParamSchema = z.object({
  boardId: z.string().uuid(),
  columnId: z.string().uuid(),
});

export const createTaskSchema = z.object({
  boardId: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  checklist: z.array(checklistItemSchema).optional(),
  enableSoundAlerts: z.boolean().optional(),
  isConcluded: z.boolean().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  hours: z.number().min(0).optional(),
  focusMinutes: z.number().int().min(1).max(120).optional(),
  shortBreakMinutes: z.number().int().min(1).max(60).optional(),
  longBreakMinutes: z.number().int().min(1).max(120).optional(),
  longBreakEvery: z.number().int().min(1).max(20).optional(),
});

export const updateTaskSchema = z
  .object({
    boardId: z.string().uuid().optional(),
    columnId: z.string().uuid().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    checklist: z.array(checklistItemSchema).optional(),
    enableSoundAlerts: z.boolean().optional(),
    isConcluded: z.boolean().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    hours: z.number().min(0).optional(),
    focusMinutes: z.number().int().min(1).max(120).optional(),
    shortBreakMinutes: z.number().int().min(1).max(60).optional(),
    longBreakMinutes: z.number().int().min(1).max(120).optional(),
    longBreakEvery: z.number().int().min(1).max(20).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado",
  });

export const updateTaskTimerSchema = z
  .object({
    focusMinutes: z.number().int().min(1).max(120).optional(),
    shortBreakMinutes: z.number().int().min(1).max(60).optional(),
    longBreakMinutes: z.number().int().min(1).max(120).optional(),
    longBreakEvery: z.number().int().min(1).max(20).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo de timer deve ser informado",
  });

export const reorderTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskTimerInput = z.infer<typeof updateTaskTimerSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
