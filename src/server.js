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
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.static(path.join(__dirname, '../frontend')));

// Read once at startup
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || '900000',
  10
);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

const calldripLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

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
 codex/add-rate-limiting-middleware
    .unknown(),
  call: Joi.object({
    id: Joi.string().required(),
    duration: Joi.number().min(0),
    response_time: Joi.number().min(0),
  })
    .required()
    .unknown(),
  scored_call: Joi.object({
    percentage: Joi.number().min(0).max(100),
    opportunity: Joi.boolean(),
  }).unknown(),
}).unknown();

// Webhook endpoint
app.post('/api/webhooks/calldrip', calldripLimiter, async (req, res) => {
  const secret = WEBHOOK_SECRET || '';
  const receivedSig = req.get('X-Signature') || '';
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex');
  if (receivedSig !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const payload = req.body || {};
  const { error } = payloadSchema.validate(payload);
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const agentPayload = payload.agent;
  const agentId = agentPayload.id;
  const callId = payload.call.id;

  let agent = await Agent.findByPk(agentId);
  if (!agent) {
    agent = await Agent.create({
      id: agentId,
      firstName: agentPayload.first_name || '',
      lastName: agentPayload.last_name || '',
      totalPoints: 0,
    });
  }

  const existingCall = await Call.findOne({ where: { externalId: callId } });
  if (existingCall) {
    return res
      .status(200)
      .json({ pointsAwarded: 0, duplicate: true });
  }

  const points = computePoints(payload);
  agent.totalPoints += points;
  await agent.save();
  await Call.create({ externalId: callId, agentId, points });

  res.json({ pointsAwarded: points });
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  let { limit, offset, page } = req.query;
  limit = limit !== undefined ? parseInt(limit, 10) : undefined;
  if (Number.isNaN(limit) || limit <= 0) {
    limit = undefined;
  }

  if (page !== undefined && offset === undefined && limit !== undefined) {
    const pageNum = parseInt(page, 10);
    if (!Number.isNaN(pageNum) && pageNum > 0) {
      offset = (pageNum - 1) * limit;
    }
  } else if (offset !== undefined) {
    offset = parseInt(offset, 10);
    if (Number.isNaN(offset) || offset < 0) {
      offset = undefined;
    }
  }

@@ -111,39 +129,35 @@ app.get('/api/leaderboard', async (req, res) => {
 main

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