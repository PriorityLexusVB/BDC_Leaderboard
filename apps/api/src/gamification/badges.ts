export const BADGES = {
  SPEED_DEMON: { label: 'Speed Demon', criteria: { fastResponsesInRow: 5 } },
  QUALITY_CHAMPION: { label: 'Quality Champion', criteria: { highScoresInRow: 5 } },
  MARATHONER: { label: 'Marathoner', criteria: { longCallsInDay: 10 } }
} as const;
