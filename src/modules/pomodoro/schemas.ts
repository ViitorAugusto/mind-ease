import { z } from "zod";

export const updateSettingsSchema = z.object({
  focusMinutes: z.number().int().min(1).max(120).optional(),
  shortBreakMinutes: z.number().int().min(1).max(60).optional(),
  longBreakMinutes: z.number().int().min(1).max(120).optional(),
  longBreakEvery: z.number().int().min(1).max(20).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
