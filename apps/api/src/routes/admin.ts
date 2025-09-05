import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireManager } from "../utils/auth";

export const admin = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/admin/challenges
 * body: { name: string, description?: string, start_at: string (ISO), end_at: string (ISO), rule_filter?: any, is_active?: boolean }
 */
admin.post("/challenges", requireManager, async (req, res, next) => {
  try {
    const { name, description, start_at, end_at, rule_filter, is_active } = req.body ?? {};
    if (!name || !start_at || !end_at) {
      return res.status(400).json({ error: "name, start_at, end_at are required" });
    }
    const start = new Date(start_at);
    const end = new Date(end_at);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "start_at and end_at must be valid ISO dates" });
    }

    const created = await prisma.challenge.create({
      data: {
        name,
        description: description ?? null,
        start_at: start,
        end_at: end,
        rule_filter: rule_filter ?? null,
        is_active: typeof is_active === "boolean" ? is_active : true,
      },
    });
    res.json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/challenges
 * Optional query: active=true|false
 */
admin.get("/challenges", requireManager, async (req, res, next) => {
  try {
    const { active } = req.query;
    const where: any = {};
    if (typeof active === "string") {
      where.is_active = active === "true";
    }
    const list = await prisma.challenge.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/challenges/:id
 * body: any subset of { name, description, start_at, end_at, rule_filter, is_active }
 */
admin.patch("/challenges/:id", requireManager, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });

    const data: any = {};
    const { name, description, start_at, end_at, rule_filter, is_active } = req.body ?? {};

    if (typeof name === "string") data.name = name;
    if (typeof description === "string" || description === null) data.description = description ?? null;
    if (typeof is_active === "boolean") data.is_active = is_active;
    if (start_at) {
      const d = new Date(start_at);
      if (isNaN(d.getTime())) return res.status(400).json({ error: "invalid start_at" });
      data.start_at = d;
    }
    if (end_at) {
      const d = new Date(end_at);
      if (isNaN(d.getTime())) return res.status(400).json({ error: "invalid end_at" });
      data.end_at = d;
    }
    if (rule_filter !== undefined) data.rule_filter = rule_filter;

    const updated = await prisma.challenge.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/challenges/:id
 */
admin.delete("/challenges/:id", requireManager, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });

    await prisma.challenge.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});