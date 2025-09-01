const express = require('express');
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
  res.json({ pointsAwarded: points });
});

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = Array.from(agents.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  res.json({ leaderboard });
});

// Agent dashboard endpoint
app.get('/api/agents/:agentId/dashboard', (req, res) => {
  const agentId = String(req.params.agentId);
  const agent = agents.get(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const agentCalls = callsByAgent.get(agentId) || [];
  res.json({ agent, calls: agentCalls });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
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
