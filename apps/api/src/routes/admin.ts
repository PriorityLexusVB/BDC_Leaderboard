import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { nightlyBackfill } from '../jobs/backfill';

export const admin = Router();
const prisma = new PrismaClient();

// TODO: add JWT manager auth middleware
admin.put('/rules', async (req, res) => {
  const rules = req.body as { event_type: string; points_value: number; description?: string; is_active?: boolean }[];
  const tx = await prisma.$transaction(
    rules.map(r => prisma.gamificationRule.upsert({
      where: { event_type: r.event_type },
      update: { points_value: r.points_value, description: r.description || r.event_type, is_active: r.is_active ?? true },
      create: { event_type: r.event_type, points_value: r.points_value, description: r.description || r.event_type, is_active: r.is_active ?? true }
    }))
  );
  res.json({ updated: tx.length });
});

admin.post('/run-backfill', async (_req, res, next) => {
  try {
    await nightlyBackfill();
    res.json({ ok: true });
  } catch (e) { next(e); }
});
