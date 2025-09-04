import { RULES } from './rules';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function awardPointsForEvent(agentId: string, call: any, scored?: any) {
  const logs: { rule: string; points: number; callId?: string }[] = [];

  if (call.response_time != null && call.response_time < RULES.FAST_RESPONSE.thresholdSec) {
    logs.push({ rule: 'FAST_RESPONSE', points: RULES.FAST_RESPONSE.points, callId: call.id });
  }
  if (call.duration != null && call.duration >= RULES.LONG_CALL.thresholdSec) {
    logs.push({ rule: 'LONG_CALL', points: RULES.LONG_CALL.points, callId: call.id });
  }
  if (scored?.percentage != null && scored.percentage >= RULES.HIGH_SCORE.thresholdPct) {
    logs.push({ rule: 'HIGH_SCORE', points: RULES.HIGH_SCORE.points, callId: call.id });
  }
  if (scored?.is_goal) {
    logs.push({ rule: 'GOAL_MET', points: RULES.GOAL_MET.points, callId: call.id });
  }
  if (scored?.appointmentDate || scored?.appointmentTime) {
    logs.push({ rule: 'APPT_SET', points: RULES.APPT_SET.points, callId: call.id });
  }
  if (scored?.opportunity) {
    logs.push({ rule: 'OPPORTUNITY', points: RULES.OPPORTUNITY.points, callId: call.id });
  }

  if (!logs.length) return;

  await prisma.$transaction(async (tx) => {
    for (const l of logs) {
      const rule = await tx.gamificationRule.upsert({
        where: { event_type: l.rule },
        update: {},
        create: { event_type: l.rule, points_value: l.points, description: l.rule, is_active: true }
      });
      await tx.pointsLog.create({
        data: {
          agent_id: agentId,
          call_id: l.callId || null,
          rule_id: rule.id,
          points_awarded: l.points
        }
      });
      await tx.agent.upsert({
        where: { id: agentId },
        update: { total_points: { increment: l.points } },
        create: { id: agentId, first_name: 'Unknown', last_name: 'Agent', total_points: l.points }
      });
    }
  });
}
