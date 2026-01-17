import { z } from "zod";

export const historyQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
