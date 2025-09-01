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
src/server.js
+19
-5

const express = require('express');
const Joi = require('joi');
const crypto = require('crypto');
const path = require('path');
const { computePoints } = require('./gamification');

const envSchema = Joi.object({
  WEBHOOK_SECRET: Joi.string().required(),
  DATABASE_URL: Joi.string().default('sqlite:database.sqlite'),
  PORT: Joi.number().integer().min(1).default(3000),
}).unknown();

const { error: envError, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
});
if (envError) {
  console.error(`Environment validation error: ${envError.message}`);
  process.exit(1);
}
process.env.WEBHOOK_SECRET = envVars.WEBHOOK_SECRET;
process.env.DATABASE_URL = envVars.DATABASE_URL;
process.env.PORT = String(envVars.PORT);

const { Agent, Call, initDb } = require('./db');

const app = express();
app.use(express.static(path.join(__dirname, '../frontend')));

// Read once at startup
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Capture the raw body so we can verify the signature
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// validation schema
const payloadSchema = Joi.object({
  agent: Joi.object({
    id: Joi.string().required(),
    first_name: Joi.string().allow(''),
    last_name: Joi.string().allow(''),
  })
    .required()
@@ -111,39 +129,35 @@ app.get('/api/leaderboard', async (req, res) => {

  const [leaderboard, totalCount] = await Promise.all([
    Agent.findAll({
      order: [['totalPoints', 'DESC']],
      limit,
      offset,
    }),
    Agent.count(),
  ]);

  const pageSize = limit || leaderboard.length;
  res.json({ leaderboard, pagination: { totalCount, pageSize } });
});

// Agent dashboard endpoint
app.get('/api/agents/:agentId/dashboard', async (req, res) => {
  const agentId = req.params.agentId;
  const agent = await Agent.findByPk(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const agentCalls = await Call.findAll({ where: { agentId } });
  res.json({ agent, calls: agentCalls });
});

const PORT = Number(process.env.PORT);
if (require.main === module) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  });
}

module.exports = { app, initDb };