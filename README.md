# BDC_Leaderboard

Simple Express-based prototype for call center gamification.

## Endpoints

- `POST /api/webhooks/calldrip` - Accepts webhook payloads from Calldrip and awards points.
- `GET /api/leaderboard` - Returns current leaderboard sorted by points.
- `GET /api/agents/:agentId/dashboard` - Returns stats for a given agent.

## Development

Install dependencies and start the server:

```bash
npm install
npm start
```

## Testing

Run the test suite:

```bash
npm test
```

No additional environment variables are required. The server will use `PORT` if set, but tests run against the in-memory app.

To automatically rerun tests on file changes (Node 18+):

```bash
npm test -- --watch
```
