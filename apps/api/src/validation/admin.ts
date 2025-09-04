import { z } from 'zod';

export const createChallengeSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date(),
  rule_filter: z.any().optional().nullable(),
});

export const upsertRulesSchema = z.array(z.object({
  event_type: z.string().min(2).max(64),
  points_value: z.coerce.number().int().min(0).max(1000),
  description: z.string().max(300).optional().nullable(),
  is_active: z.coerce.boolean().optional(),
}));
