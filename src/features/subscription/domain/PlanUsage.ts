import { z } from 'zod';

export const DailyPlanUsageSchema = z.object({
  dateKey: z.string(),
  stickersUsed: z.number().int().min(0).default(0),
  stickerLimitExhaustedAt: z.string().datetime().optional(),
});

export type DailyPlanUsage = z.infer<typeof DailyPlanUsageSchema>;

export const PlanUsageEnvelopeSchema = z.object({
  daily: z.record(z.string(), DailyPlanUsageSchema).default({}),
});

export type PlanUsageEnvelope = z.infer<typeof PlanUsageEnvelopeSchema>;
