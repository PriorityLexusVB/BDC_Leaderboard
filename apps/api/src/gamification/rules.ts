export const RULES = {
  FAST_RESPONSE: { event_type: "FAST_RESPONSE", points: 5,  description: "Response under 30s" },
  LONG_CALL:     { event_type: "LONG_CALL",     points: 3,  description: "Duration ≥ 3m" },
  HIGH_SCORE:    { event_type: "HIGH_SCORE",    points: 8,  description: "QA ≥ 90%" },
  GOAL_MET:      { event_type: "GOAL_MET",      points: 10, description: "Goal met" },
  APPT_SET:      { event_type: "APPT_SET",      points: 12, description: "Appointment set" },
  OPPORTUNITY:   { event_type: "OPPORTUNITY",   points: 4,  description: "Opportunity flagged" },
} as const;

export type RuleKey = keyof typeof RULES;