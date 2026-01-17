import { z } from "zod";

export const startSessionSchema = z.object({
  type: z.enum(["FOCUS", "SHORT_BREAK", "LONG_BREAK"]),
  taskId: z.string().optional(),
});

export const finishSessionSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELED", "EXPIRED"]),
  endedAt: z.string().datetime().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type FinishSessionInput = z.infer<typeof finishSessionSchema>;
