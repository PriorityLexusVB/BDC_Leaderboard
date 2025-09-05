import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyWebhookSecret } from "../utils/auth";
import { runGamification } from "../gamification/engine";
import { logger } from "../utils/logger";

export const webhooks = express.Router();
const prisma = new PrismaClient();

function extractTeam(body: any): string | undefined {
  return (
    body?.scored_call?.cd?.department ??
    body?.scored_call?.cd?.cat1Name ??
    body?.call?.department ??
    body?.call?.flow ??
    undefined
  );
}

webhooks.post("/calldrip", async (req, res, next) => {
  try {
    const ok = verifyWebhookSecret(req);
    if (!ok) return res.status(401).json({ error: "unauthorized" });

    const body = req.body ?? {};
    const teamName = (extractTeam(body) ?? "").trim() || null;

    // ensure team exists (optional)
    if (teamName) {
      await prisma.team.upsert({
        where: { name: teamName },
        update: {},
        create: { name: teamName, allowed: true },
      });
      const t = await prisma.team.findUnique({ where: { name: teamName } });
      if (t && t.allowed === false) {
        logger.info({ teamName }, "Skipping scoring: team not allowed");
        return res.status(202).json({ ok: true, skipped: "team_not_allowed", team: teamName });
      }
    }

    // run your existing rules (this creates/updates Agent, Call, PointsLog, etc.)
    await runGamification(prisma, body, { teamName }); // pass teamName so engine can persist it on Call

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
