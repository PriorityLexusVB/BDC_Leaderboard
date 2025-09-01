# BDC_Leaderboard

Simple Express-based prototype for call center gamification.

## Endpoints

- `POST /api/webhooks/calldrip` - Accepts webhook payloads from Calldrip and awards points.
- `GET /api/leaderboard` - Returns current leaderboard sorted by points.
- `GET /api/agents/:agentId/dashboard` - Returns stats for a given agent.

## Development

Set the following environment variables before starting the server:

- `WEBHOOK_SECRET` – required, shared secret used to verify webhook signatures.
- `DATABASE_URL` – connection string for the database (defaults to `sqlite:database.sqlite`).
- `PORT` – optional port for the HTTP server (defaults to `3000`).

Install dependencies and start the server:

```bash
npm install
WEBHOOK_SECRET=your_secret DATABASE_URL=sqlite:database.sqlite npm start
```

## Testing

Run the test suite:

```bash
npm test
```

Set `WEBHOOK_SECRET` to the shared secret used to sign webhook requests. The server will use `PORT` and `DATABASE_URL` if set, but tests run against the in-memory app.

To automatically rerun tests on file changes (Node 18+):

```bash
npm test -- --watch
```