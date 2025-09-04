import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

export const challenges = Router();
const prisma = new PrismaClient();

// Public: list active challenges + computed standings
challenges.get('/active', async (_req, res, next) => {
  try {
    const now = new Date();
    const active = await prisma.challenge.findMany({
      where: { is_active: true, start_at: { lte: now }, end_at: { gte: now } },
      orderBy: { start_at: 'desc' }
    });

    const result: any[] = [];
    for (const ch of active) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `
        SELECT a.id, a.first_name, a.last_name,
               COALESCE(SUM(pl.points_awarded),0) AS points
        FROM "Agent" a
        LEFT JOIN "PointsLog" pl
          ON pl.agent_id = a.id
         AND pl."timestamp" BETWEEN $1 AND $2
        GROUP BY a.id, a.first_name, a.last_name
        ORDER BY points DESC
        LIMIT 50;
        `,
        ch.start_at, ch.end_at
      );
      result.push({ challenge: ch, standings: rows });
    }

    res.json(result);
  } catch (e) { next(e); }
});
