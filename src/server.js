const express = require('express');
 codex/add-validation-for-call-parameters
const Joi = require('joi');

const crypto = require('crypto');
 main
const { computePoints } = require('./gamification');
const { Agent, Call, initDb, sequelize } = require('./db');

const app = express();
// Capture the raw body so we can verify the signature
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// validation schema
const payloadSchema = Joi.object({
  call: Joi.object({
    duration: Joi.number().min(0),
    response_time: Joi.number().min(0)
  }).unknown(),
  scored_call: Joi.object({
    percentage: Joi.number().min(0).max(100)
  }).unknown()
}).unknown();

// Webhook endpoint
 codex/introduce-database-layer-with-orm
app.post('/api/webhooks/calldrip', async (req, res) => {

app.post('/api/webhooks/calldrip', (req, res) => {
  const secret = process.env.WEBHOOK_SECRET || '';
  const receivedSig = req.get('X-Signature') || '';
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex');
  if (receivedSig !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
 main
  const payload = req.body || {};
  const agentPayload = payload.agent || {};
  const agentId = agentPayload.id;
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agent.id' });
  }

 codex/add-validation-for-call-parameters
  const { error } = payloadSchema.validate(payload);
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // create or update agent
  const a = agents.get(agentId) || {
    id: agentId,
    firstName: agent.first_name || '',
    lastName: agent.last_name || '',
    totalPoints: 0
  };

  let agent = await Agent.findByPk(agentId);
  if (!agent) {
    agent = await Agent.create({
      id: agentId,
      firstName: agentPayload.first_name || '',
      lastName: agentPayload.last_name || '',
      totalPoints: 0
    });
  }

 main
  const points = computePoints(payload);
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
  res.json({ pointsAwarded: points });
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  const leaderboard = await Agent.findAll({ order: [['totalPoints', 'DESC']] });
  res.json({ leaderboard });
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

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  });
}

module.exports = { app, initDb };
