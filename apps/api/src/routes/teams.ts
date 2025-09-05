import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireManager } from "../utils/auth";

const prisma = new PrismaClient();
export const teams = express.Router();

teams.get("/public/allowed", async (_req, res, next) => {
  try {
    const list = await prisma.team.findMany({
      where: { allowed: true },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

teams.post("/allow", requireManager, async (req, res, next) => {
  try {
    const { names, allowed } = req.body ?? {};
    if (!Array.isArray(names) || typeof allowed !== "boolean" || names.length === 0) {
      return res.status(400).json({ error: "names[] and allowed:boolean are required" });
    }
    await prisma.team.updateMany({
      where: { name: { in: names } },
      data: { allowed },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
