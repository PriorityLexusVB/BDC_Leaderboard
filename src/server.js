const express = require('express');
const { computePoints } = require('./gamification');

const app = express();
app.use(express.json());

// In-memory stores for demo purposes
const agents = new Map(); // agentId -> {id, firstName, lastName, totalPoints}
const calls = []; // {id, agentId, points}

// Webhook endpoint
app.post('/api/webhooks/calldrip', (req, res) => {
  const payload = req.body || {};
  const agent = payload.agent || {};
  const agentId = agent.id;
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agent.id' });
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
  calls.push({ id: payload.call?.id, agentId, points });
  res.json({ pointsAwarded: points });
});

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = Array.from(agents.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  res.json({ leaderboard });
});

// Agent dashboard endpoint
app.get('/api/agents/:agentId/dashboard', (req, res) => {
  const agentId = req.params.agentId;
  const agent = agents.get(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const agentCalls = calls.filter(c => c.agentId === agentId);
  res.json({ agent, calls: agentCalls });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

module.exports = app;
