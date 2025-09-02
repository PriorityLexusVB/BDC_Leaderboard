import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.gamificationRule.createMany({
    data: [
      { event_type: 'FAST_RESPONSE', points_value: 5, description: 'Response under 30s' },
      { event_type: 'LONG_CALL', points_value: 3, description: 'Duration ≥ 3m' },
      { event_type: 'HIGH_SCORE', points_value: 8, description: 'QA ≥ 90%' },
      { event_type: 'GOAL_MET', points_value: 10, description: 'Goal met' },
      { event_type: 'APPT_SET', points_value: 12, description: 'Appointment scheduled' },
      { event_type: 'OPPORTUNITY', points_value: 4, description: 'Sales opportunity flagged' }
    ],
    skipDuplicates: true
  });

  await prisma.badge.createMany({
    data: [
      { name: 'Speed Demon', description: '5 fast responses in a row' },
      { name: 'Quality Champion', description: '5 high QA scores in a row' },
      { name: 'Marathoner', description: '10 long calls in a day' }
    ],
    skipDuplicates: true
  });
}

main().finally(() => prisma.$disconnect());
