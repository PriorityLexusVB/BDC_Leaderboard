import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

export const leaderboard = Router();
const prisma = new PrismaClient();

leaderboard.get('/', async (req, res) => {
  const period = (req.query.period as string) || 'weekly';
  const since = period === 'daily' ? dayjs().startOf('day')
            : period === 'monthly' ? dayjs().startOf('month')
            : dayjs().startOf('week');

  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT a.id, a.first_name, a.last_name,
           SUM(pl.points_awarded) AS points
    FROM "PointsLog" pl
    JOIN "Agent" a ON a.id = pl.agent_id
    WHERE pl."timestamp" >= $1
    GROUP BY a.id, a.first_name, a.last_name
    ORDER BY points DESC
    LIMIT 50;
  `, since.toDate());
  res.json(rows);
});
