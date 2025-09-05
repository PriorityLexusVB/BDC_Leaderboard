import express from "express";
import { PrismaClient } from "@prisma/client";
export const challenges = express.Router();
const prisma = new PrismaClient();

challenges.get("/active", async (_req, res, next) => {
  try {
    const now = new Date();
    const active = await prisma.challenge.findMany({
      where: { is_active: true, start_at: { lte: now }, end_at: { gte: now } },
      orderBy: { created_at: "asc" },
      take: 20,
    });

    // minimal standings: sum points within window per agent
    const results = await Promise.all(active.map(async ch => {
      const rows = await prisma.pointsLog.groupBy({
        by: ["agent_id"],
        _sum: { points_awarded: true },
        where: { timestamp: { gte: ch.start_at, lte: ch.end_at } },
        orderBy: { _sum: { points_awarded: "desc" } },
        take: 100,
      });

      const ids = rows.map(r => r.agent_id);
      const agents = await prisma.agent.findMany({
        where: { id: { in: ids } },
        select: { id: true, first_name: true, last_name: true },
      });
      const map = new Map(agents.map(a => [a.id, a]));

      const standings = rows.map(r => ({
        id: r.agent_id,
        first_name: map.get(r.agent_id)?.first_name ?? null,
        last_name: map.get(r.agent_id)?.last_name ?? null,
        points: r._sum.points_awarded ?? 0,
      }));

      return { challenge: ch, standings };
    }));

    res.json(results);
  } catch (e) { next(e); }
});