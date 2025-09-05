import express from "express";
import { PrismaClient } from "@prisma/client";
export const agents = express.Router();
const prisma = new PrismaClient();

agents.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.agent.findMany({
      select: { id: true, first_name: true, last_name: true, email: true, total_points: true },
      take: 200,
    });
    res.json(list);
  } catch (e) { next(e); }
});