export const RULES = {
  FAST_RESPONSE: { points: 5, thresholdSec: 30, desc: 'Response < 30s' },
  LONG_CALL: { points: 3, thresholdSec: 180, desc: 'Duration ≥ 3m' },
  HIGH_SCORE: { points: 8, thresholdPct: 90, desc: 'QA ≥ 90%' },
  GOAL_MET: { points: 10, desc: 'Goal met' },
  APPT_SET: { points: 12, desc: 'Appointment set' },
  OPPORTUNITY: { points: 4, desc: 'Opportunity flagged' }
} as const;
