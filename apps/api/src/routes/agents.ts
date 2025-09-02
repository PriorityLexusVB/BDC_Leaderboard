import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

export const agents = Router();
const prisma = new PrismaClient();

agents.get('/:agentId/dashboard', async (req, res) => {
  const { agentId } = req.params;
  const [agent, recent, badges] = await Promise.all([
    prisma.agent.findUnique({ where: { id: agentId } }),
    prisma.pointsLog.findMany({ where: { agent_id: agentId }, orderBy: { timestamp: 'desc' }, take: 25, include: { rule: true, call: true } }),
    prisma.agentBadges.findMany({ where: { agent_id: agentId }, include: { badge: true } })
  ]);
  res.json({ agent, recent, badges });
});
