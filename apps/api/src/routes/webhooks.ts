import { Router } from 'express';
import { assertWebhookSecret } from '../utils/auth';
import { awardPointsForEvent } from '../gamification/engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const webhooks = Router();

webhooks.post('/calldrip', async (req, res, next) => {
  try {
    assertWebhookSecret(req);
    const payload = req.body;

    const agent = payload.agent || {};
    const call = payload.call || {};
    if (!call?.id) return res.status(400).json({ error: 'Missing call.id' });

    await prisma.agent.upsert({
      where: { id: String(agent.id) },
      update: { first_name: agent.first_name || 'Unknown', last_name: agent.last_name || 'Agent', email: agent.email || null },
      create: { id: String(agent.id), first_name: agent.first_name || 'Unknown', last_name: agent.last_name || 'Agent', email: agent.email || null }
    });

    await prisma.call.upsert({
      where: { id: String(call.id) },
      update: {},
      create: {
        id: String(call.id),
        agent_id: String(agent.id),
        status: call.status,
        duration: call.duration ?? null,
        response_time: call.response_time ?? null,
        recording_url: call.recording_url ?? null,
        call_date: call.date_received ? new Date(call.date_received) : null,
        raw_payload: payload
      }
    });

    await awardPointsForEvent(String(agent.id), call, payload.scored_call);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
