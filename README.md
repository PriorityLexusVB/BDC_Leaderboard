# BDC_Leaderboard

Simple Express-based prototype for call center gamification.

## Endpoints

- `POST /api/webhooks/calldrip` - Accepts webhook payloads from Calldrip and awards points.
- `GET /api/leaderboard` - Returns current leaderboard sorted by points.
- `GET /api/agents/:agentId/dashboard` - Returns stats for a given agent.

## Development

```bash
npm install
npm start
```
