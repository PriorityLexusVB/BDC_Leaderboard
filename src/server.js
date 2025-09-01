const express = require('express');
 codex/summarize-call-center-gamification-features-b0d3sd
const { computePoints } = require('./gamification');

const app = express();
app.use(express.json());

// In-memory stores for demo purposes
const agents = new Map(); // agentId -> {id, firstName, lastName, totalPoints}
const callsByAgent = new Map(); // agentId -> [{id, points}]
const processedCalls = new Set(); // track processed call IDs to avoid duplicates

// Webhook endpoint
app.post('/api/webhooks/calldrip', (req, res) => {
  const payload = req.body || {};
  const agent = payload.agent || {};
  const agentIdRaw = agent.id;
  if (agentIdRaw === undefined || agentIdRaw === null || agentIdRaw === '') {
    return res.status(400).json({ error: 'Missing agent.id' });
  }
  const agentId = String(agentIdRaw);
  const callId = payload.call?.id;
  if (callId && processedCalls.has(callId)) {
    return res.status(200).json({ pointsAwarded: 0, duplicate: true });
  }
  // create or update agent
  const a = agents.get(agentId) || {
    id: agentId,
    firstName: agent.first_name || '',
    lastName: agent.last_name || '',
    totalPoints: 0
  };
  const points = computePoints(payload);
  a.totalPoints += points;
  agents.set(agentId, a);
  const agentCalls = callsByAgent.get(agentId) || [];
  agentCalls.push({ id: callId, points });
  callsByAgent.set(agentId, agentCalls);
  if (callId) processedCalls.add(callId);

const Joi = require('joi');
const crypto = require('crypto');
 codex/resolve-merge-conflicts-in-pull-request


 main
const { computePoints } = require('./gamification');
const { Agent, Call, initDb, sequelize } = require('./db');

const app = express();

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
    last_name: Joi.string().allow('')
  }).required().unknown(),
  call: Joi.object({
    id: Joi.string().required(),
    duration: Joi.number().min(0),
 codex/resolve-merge-conflicts-in-pull-request
    response_time: Joi.number().min(0)
  }).required().unknown(),

    response_time: Joi.number().min(0),
  }).unknown(),
 main
  scored_call: Joi.object({
    percentage: Joi.number().min(0).max(100),
  }).unknown(),
}).unknown();

// Webhook endpoint
app.post('/api/webhooks/calldrip', async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET || '';
  const receivedSig = req.get('X-Signature') || '';
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex');
  if (receivedSig !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
 codex/resolve-merge-conflicts-in-pull-request

  const payload = req.body || {};


  const payload = req.body || {};
  const agentPayload = payload.agent || {};
  const agentId = agentPayload.id;
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agent.id' });
  }

 main
  const { error } = payloadSchema.validate(payload);
  if (error) {
    return res.status(400).json({ error: error.message });
  }

 codex/resolve-merge-conflicts-in-pull-request
  const agentPayload = payload.agent;
  const agentId = agentPayload.id;
  if (agentId == null || agentId === '') {
    return res.status(400).json({ error: 'Missing agent.id' });
  }

  const callId = payload.call.id;
  if (!callId) {
    return res.status(400).json({ error: 'Missing call.id' });
  }


  // create agent if needed
 main
  let agent = await Agent.findByPk(agentId);
  if (!agent) {
    agent = await Agent.create({
      id: agentId,
      firstName: agentPayload.first_name || '',
      lastName: agentPayload.last_name || '',
      totalPoints: 0,
    });
  }

 codex/resolve-merge-conflicts-in-pull-request
  const existingCall = await Call.findOne({ where: { externalId: callId } });
  if (existingCall) {
    return res.status(200).json({ pointsAwarded: 0, duplicate: true });
  }

  const points = computePoints(payload);
  agent.totalPoints += points;
  await agent.save();
  await Call.create({ externalId: callId, agentId, points });


  const externalId = payload.call?.id ?? null;
  if (externalId) {
    const existing = await Call.findOne({ where: { externalId } });
    if (existing) {
      return res.status(200).json({ pointsAwarded: 0 });
    }
  }

  const points = computePoints(payload);
 codex/update-webhook-handler-for-point-allocation
  await Agent.increment('totalPoints', { by: points, where: { id: agentId } });
  await Call.create({ externalId, agentId, points });


  await sequelize.transaction(async (t) => {
    await Agent.increment(
      { totalPoints: points },
      { where: { id: agentId }, transaction: t }
    );
    await Call.create(
      { externalId: payload.call?.id ?? null, agentId, points },
      { transaction: t }
    );
  });
 main
 main
 main
  res.json({ pointsAwarded: points });
});

// Leaderboard endpoint
 codex/summarize-call-center-gamification-features-b0d3sd
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = Array.from(agents.values()).sort((a, b) => b.totalPoints - a.totalPoints);

app.get('/api/leaderboard', async (req, res) => {
  const leaderboard = await Agent.findAll({ order: [['totalPoints', 'DESC']] });
 main
  res.json({ leaderboard });
});

// Agent dashboard endpoint
 codex/summarize-call-center-gamification-features-b0d3sd
app.get('/api/agents/:agentId/dashboard', (req, res) => {
  const agentId = String(req.params.agentId);
  const agent = agents.get(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const agentCalls = callsByAgent.get(agentId) || [];

app.get('/api/agents/:agentId/dashboard', async (req, res) => {
  const agentId = req.params.agentId;
  const agent = await Agent.findByPk(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const agentCalls = await Call.findAll({ where: { agentId } });
 main
  res.json({ agent, calls: agentCalls });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
 codex/summarize-call-center-gamification-features-b0d3sd
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

function resetData() {
  agents.clear();
  callsByAgent.clear();
  processedCalls.clear();
}

module.exports = { app, resetData };

  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  });
}

module.exports = { app, initDb };

 main
