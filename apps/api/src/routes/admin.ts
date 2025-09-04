import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { sendWinnersDigest } from '../jobs/notify';
import { createChallengeSchema, upsertRulesSchema } from '../validation/admin';

export const admin = Router();
const prisma = new PrismaClient();

/** Simple JWT guard for manager-only routes */
admin.use((req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const [, token] = auth.split(' ');
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT not configured' });
    const payload = jwt.verify(token, secret) as any;
    if (payload?.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
    (req as any).manager = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

/** Create a challenge (validated) */
admin.post('/challenges', async (req, res, next) => {
  try {
    const parsed = createChallengeSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { name, description, start_at, end_at, rule_filter } = parsed.data;
    if (start_at >= end_at) return res.status(400).json({ error: 'start_at must be before end_at' });

    const created = await prisma.challenge.create({
      data: {
        name,
        description: description ?? null,
        start_at,
        end_at,
        rule_filter: rule_filter ?? null,
        is_active: true,
      },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

/** List all rules (manager-only) */
admin.get('/rules', async (_req, res, next) => {
  try {
    const rules = await prisma.gamificationRule.findMany({
      orderBy: [{ event_type: 'asc' }],
    });
    res.json(rules);
  } catch (e) { next(e); }
});

/** Bulk upsert rules (validated) */
admin.put('/rules', async (req, res, next) => {
  try {
    const parsed = upsertRulesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const rules = parsed.data;

    for (const r of rules) {
      await prisma.gamificationRule.upsert({
        where: { event_type: r.event_type },
        update: {
          points_value: r.points_value,
          description: r.description ?? null,
          is_active: r.is_active ?? true,
        },
        create: {
          event_type: r.event_type,
          points_value: r.points_value,
          description: r.description ?? null,
          is_active: r.is_active ?? true,
        },
      });
    }
    res.json({ ok: true, count: rules.length });
  } catch (e) { next(e); }
});

/** Close a challenge and snapshot standings */
admin.post('/challenges/:id/close', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });

    const ch = await prisma.challenge.findUnique({ where: { id } });
    if (!ch) return res.status(404).json({ error: 'not found' });

    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT a.id as agent_id, COALESCE(SUM(pl.points_awarded),0) AS points
      FROM "Agent" a
      LEFT JOIN "PointsLog" pl
        ON pl.agent_id = a.id
       AND pl."timestamp" BETWEEN $1 AND $2
      GROUP BY a.id
      ORDER BY points DESC;
      `,
      ch.start_at, ch.end_at
    );

    let rank = 1;
    for (const r of rows) {
      await prisma.challengeEntry.create({
        data: {
          challenge_id: id,
          agent_id: r.agent_id,
          points: Number(r.points || 0),
          rank,
          snapshot: true,
        },
      });
      rank += 1;
    }

    await prisma.challenge.update({ where: { id }, data: { is_active: false } });
    res.json({ ok: true, entries: rows.length });
  } catch (e) { next(e); }
});

/** Manually trigger weekly winners Slack/Email digest */
admin.post('/notify/weekly', async (_req, res, next) => {
  try {
    const out = await sendWinnersDigest();
    res.json(out);
  } catch (e) { next(e); }
});
