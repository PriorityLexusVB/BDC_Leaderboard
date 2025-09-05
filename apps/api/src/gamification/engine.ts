import type { PrismaClient } from "@prisma/client";
import { RULES, RuleKey } from "./rules";
import { maybeAwardBadges } from "./badges";
import { logger } from "../utils/logger";

// ensure a GamificationRule row exists for an event_type
async function ensureRule(prisma: PrismaClient, key: RuleKey) {
  const { event_type, points, description } = RULES[key];
  const existing = await prisma.gamificationRule.findFirst({ where: { event_type } });
  if (existing) return existing;
  return prisma.gamificationRule.create({
    data: { event_type, points_value: points, description, is_active: true },
  });
}

type Payload = any;

/** Main entry used by the webhook route */
export async function runGamification(prisma: PrismaClient, body: Payload) {
  // 1) Normalize incoming fields
  const call  = body?.call ?? {};
  const agent = body?.agent ?? {};
  const scored = body?.scored_call ?? {};

  const callId: string = call.id ?? `call_${Date.now()}`;
  const agentId: string = agent.id ?? "unknown";

  // 2) Upsert agent
  await prisma.agent.upsert({
    where: { id: agentId },
    update: {
      first_name: agent.first_name ?? undefined,
      last_name:  agent.last_name  ?? undefined,
      email:      agent.email      ?? undefined,
      phone_number: agent.phone_number ?? undefined,
    },
    create: {
      id: agentId,
      first_name: agent.first_name ?? null,
      last_name:  agent.last_name  ?? null,
      email:      agent.email      ?? null,
      phone_number: agent.phone_number ?? null,
      total_points: 0,
    },
  });

  // 3) Upsert call
  await prisma.call.upsert({
    where: { id: callId },
    update: {
      agent_id: agentId,
      lead_id: call.lead_id ?? null,
      source_name: call.source_name ?? null,
      status: call.status ?? null,
      duration: call.duration ?? null,
      response_time: call.response_time ?? null,
      recording_url: call.recording_url ?? null,
      call_date: call.call_date ? new Date(call.call_date) : (call.date_received ? new Date(call.date_received) : null),
      origination_time: call.origination_time ? new Date(call.origination_time) : null,
      date_received: call.date_received ? new Date(call.date_received) : null,
      time_received: call.time_received ? new Date(call.time_received) : null,
      raw_payload: body,
    },
    create: {
      id: callId,
      agent_id: agentId,
      lead_id: call.lead_id ?? null,
      source_name: call.source_name ?? null,
      status: call.status ?? null,
      duration: call.duration ?? null,
      response_time: call.response_time ?? null,
      recording_url: call.recording_url ?? null,
      call_date: call.call_date ? new Date(call.call_date) : (call.date_received ? new Date(call.date_received) : null),
      origination_time: call.origination_time ? new Date(call.origination_time) : null,
      date_received: call.date_received ? new Date(call.date_received) : null,
      time_received: call.time_received ? new Date(call.time_received) : null,
      raw_payload: body,
    },
  });

  // 4) Evaluate rules
  const hits: RuleKey[] = [];
  try {
    const rt = Number(call.response_time);
    if (!Number.isNaN(rt) && rt > 0 && rt <= 30) hits.push("FAST_RESPONSE");

    const dur = Number(call.duration);
    if (!Number.isNaN(dur) && dur >= 180) hits.push("LONG_CALL");

    const pct = Number(scored.percentage);
    if (!Number.isNaN(pct) && pct >= 90) hits.push("HIGH_SCORE");

    if (scored.is_goal === true) hits.push("GOAL_MET");

    const apptDate = scored?.cd?.appointmentDate || scored?.appointmentDate;
    if (typeof apptDate === "string" && apptDate.trim().length > 0) hits.push("APPT_SET");

    if (scored.opportunity === true) hits.push("OPPORTUNITY");
  } catch (e) {
    logger.warn("Rule evaluation error:", e);
  }

  if (hits.length === 0) {
    logger.info("No rules matched; nothing to score for call", callId);
    return;
  }

  // 5) Write PointsLog rows and sum points
  let totalAward = 0;
  for (const key of hits) {
    const rule = await ensureRule(prisma, key);
    totalAward += rule.points_value;

    await prisma.pointsLog.create({
      data: {
        agent_id: agentId,
        call_id: callId,
        rule_id: rule.id,
        points_awarded: rule.points_value,
      },
    });
  }

  // 6) Increment agent total
  await prisma.agent.update({
    where: { id: agentId },
    data: { total_points: { increment: totalAward } },
  });

  // 7) Maybe award badges (no-op for now)
  await maybeAwardBadges(prisma, agentId);

  logger.info(`Awarded ${totalAward} points to agent ${agentId} for call ${callId} via rules:`, hits);
}