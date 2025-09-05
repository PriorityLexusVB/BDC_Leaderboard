import express from "express";
import { PrismaClient } from "@prisma/client";

export const leaderboard = express.Router();
const prisma = new PrismaClient();

function getWindow(period: string | undefined) {
  const now = new Date();
  let start = new Date(0);
  if (period === "weekly") {
    const d = new Date(now);
    const day = (d.getUTCDay() + 6) % 7; // Monday=0
    d.setUTCHours(0,0,0,0);
    start = new Date(d.getTime() - day * 24*60*60*1000);
  } else if (period === "daily") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  return { start, end: now };
}

leaderboard.get("/", async (req, res, next) => {
  try {
    const { start, end } = getWindow((req.query.period as string) || "weekly");

    const rows = await prisma.pointsLog.groupBy({
      by: ["agent_id"],
      _sum: { points_awarded: true },
      where: { timestamp: { gte: start, lte: end } },
      orderBy: { _sum: { points_awarded: "desc" } },
      take: 100,
    });

    // Fetch agent names
    const ids = rows.map(r => r.agent_id);
    const agents = await prisma.agent.findMany({
      where: { id: { in: ids } },
      select: { id: true, first_name: true, last_name: true },
    });
    const map = new Map(agents.map(a => [a.id, a]));

    const result = rows.map(r => {
      const a = map.get(r.agent_id);
      return {
        id: r.agent_id,
        first_name: a?.first_name ?? null,
        last_name: a?.last_name ?? null,
        points: r._sum.points_awarded ?? 0,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});