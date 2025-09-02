import dayjs from 'dayjs';
import { fetchScoredData } from '../services/calldrip';
import { PrismaClient } from '@prisma/client';
import { awardPointsForEvent } from '../gamification/engine';

const prisma = new PrismaClient();

export async function nightlyBackfill() {
  const since = dayjs().subtract(2, 'day').toISOString(); // small buffer
  let page = 1;
  // Loop through pages
  while (true) {
    const batch: any = await fetchScoredData({ since, page });
    const items = batch?.data || [];
    if (!items.length) break;
    for (const item of items) {
      const agentId = item?.agent?.id || 'unknown';
      const callId = item?.call?.id;
      if (!callId) continue;
      await prisma.agent.upsert({
        where: { id: agentId },
        update: {},
        create: { id: agentId, first_name: 'Unknown', last_name: 'Agent' }
      });
      await prisma.call.upsert({
        where: { id: callId },
        update: {},
        create: {
          id: callId,
          agent_id: agentId,
          status: item.call.status,
          duration: item.call.duration ?? null,
          response_time: item.call.response_time ?? null,
          recording_url: item.call.recording_url ?? null,
          call_date: item.call.date_received ? new Date(item.call.date_received) : null,
          raw_payload: item
        }
      });
      await awardPointsForEvent(agentId, item.call, {
        percentage: item?.scored_call?.percentage,
        is_goal: item?.scored_call?.is_goal,
        result: item?.scored_call?.result,
        appointmentDate: item?.scored_call?.cd?.appointmentDate,
        appointmentTime: item?.scored_call?.cd?.appointmentTime,
        opportunity: item?.scored_call?.opportunity
      });
    }
    page += 1;
  }
}
