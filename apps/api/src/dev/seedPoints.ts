import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Ensure a couple of demo agents exist
  await prisma.agent.upsert({
    where: { id: 'a1' },
    update: {},
    create: { id: 'a1', first_name: 'Alex', last_name: 'Agent' },
  });
  await prisma.agent.upsert({
    where: { id: 'a2' },
    update: {},
    create: { id: 'a2', first_name: 'Bea', last_name: 'Caller' },
  });

  // Find rules we seeded
  const fast = await prisma.gamificationRule.findFirst({ where: { event_type: 'FAST_RESPONSE' } });
  const high = await prisma.gamificationRule.findFirst({ where: { event_type: 'HIGH_SCORE' } });
  if (!fast || !high) throw new Error('Rules missing — run npm run seed');

  const now = new Date();

  // Award a few points this week
  await prisma.pointsLog.createMany({
    data: [
      { agent_id: 'a1', rule_id: fast.id, points_awarded: 5,  timestamp: now },
      { agent_id: 'a1', rule_id: high.id, points_awarded: 8,  timestamp: now },
      { agent_id: 'a2', rule_id: fast.id, points_awarded: 5,  timestamp: now },
    ],
  });

  console.log('Seeded sample points ✅');
}
main().finally(() => prisma.$disconnect());
