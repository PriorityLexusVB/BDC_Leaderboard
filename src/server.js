const express = require('express');
const { computePoints } = require('./gamification');
const { Agent, Call, initDb } = require('./db');

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/api/webhooks/calldrip', async (req, res) => {
  const payload = req.body || {};
  const agentPayload = payload.agent || {};
  const agentId = agentPayload.id;
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agent.id' });
  }

  let agent = await Agent.findByPk(agentId);
  if (!agent) {
    agent = await Agent.create({
      id: agentId,
      firstName: agentPayload.first_name || '',
      lastName: agentPayload.last_name || '',
      totalPoints: 0
    });
  }

  const points = computePoints(payload);
  agent.totalPoints += points;
  await agent.save();
  await Call.create({ externalId: payload.call?.id ?? null, agentId, points });
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
