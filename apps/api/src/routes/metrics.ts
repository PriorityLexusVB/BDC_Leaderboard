import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/metrics/agents?period=weekly&team=BDC
router.get("/agents", async (req, res) => {
  const { period = "weekly" } = req.query as { period?: string };

  // weekly window (Mon → Mon)
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  try {
    const agents = await prisma.agent.findMany({
      include: {
        calls: {
          where: { call_date: { gte: monday, lt: nextMonday } },
        },
        points: {
          where: { timestamp: { gte: monday, lt: nextMonday } },
        },
      },
    });

    const rows = agents.map((a) => {
      const outbound_calls = a.calls.length;
      const connected_calls = a.calls.filter((c) => c.status === "CONNECTED").length;
      const appts_set = a.calls.filter((c) => c.status === "APPT_SET").length;
      const connect_rate = outbound_calls > 0 ? Math.round((connected_calls / outbound_calls) * 100) : 0;
      const points = a.points.reduce((sum, p) => sum + p.points_awarded, 0);

      return {
        id: a.id,
        first_name: a.first_name ?? undefined,
        last_name: a.last_name ?? undefined,
        outbound_calls,
        connected_calls,
        connect_rate,
        appts_set,
        points,
      };
    });

    res.json(rows);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "metrics_failed", detail: e?.message });
  }
});

export default router;
