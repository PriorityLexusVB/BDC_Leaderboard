# BDC_Leaderboard

Simple Express-based prototype for call center gamification.

## Endpoints

- `POST /api/webhooks/calldrip` - Accepts webhook payloads from Calldrip and awards points.
- `GET /api/leaderboard` - Returns current leaderboard sorted by points.
- `GET /api/agents/:agentId/dashboard` - Returns stats for a given agent.

## Development

Install dependencies, run database migrations, and start the server:

```bash
npm install
npm run migrate
npm start
```

The server will serve the static frontend from `frontend/`. After starting,
open [http://localhost:3000](http://localhost:3000) to view the leaderboard
and agent dashboards.

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

## Frontend Build

The frontend lives in the `frontend/` directory and is plain HTML, CSS, and
JavaScript. No compilation step is required; the files are served directly by
Express. To make changes, edit the files in `frontend/` and restart the server
if necessary.
