const express = require('express');
const { computePoints } = require('./gamification');

const app = express();
app.use(express.json());

// In-memory stores for demo purposes
const agents = new Map(); // agentId -> {id, firstName, lastName, totalPoints}
 codex/summarize-call-center-gamification-features-ffji8f
const callsByAgent = new Map(); // agentId -> [{id, points}]
const processedCalls = new Set(); // track processed call IDs to avoid duplicates

const calls = []; // {id, agentId, points}
 main

// Webhook endpoint
app.post('/api/webhooks/calldrip', (req, res) => {
  const payload = req.body || {};
  const agent = payload.agent || {};
 codex/summarize-call-center-gamification-features-ffji8f
  const agentIdRaw = agent.id;
  if (agentIdRaw == null || agentIdRaw === '') {
    return res.status(400).json({ error: 'Missing agent.id' });
  }
  const agentId = String(agentIdRaw);
  const callId = payload.call?.id;
  if (callId && processedCalls.has(callId)) {
    return res.status(200).json({ pointsAwarded: 0, duplicate: true });
  }

  const agentId = agent.id;
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agent.id' });
  }
 main
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
 codex/summarize-call-center-gamification-features-ffji8f
  const agentCalls = callsByAgent.get(agentId) || [];
  agentCalls.push({ id: callId, points });
  callsByAgent.set(agentId, agentCalls);
  if (callId) processedCalls.add(callId);

  calls.push({ id: payload.call?.id ?? null, agentId, points });
 main
  res.json({ pointsAwarded: points });
});

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = Array.from(agents.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  res.json({ leaderboard });
});

// Agent dashboard endpoint
app.get('/api/agents/:agentId/dashboard', (req, res) => {
 codex/summarize-call-center-gamification-features-ffji8f
  const agentId = String(req.params.agentId);

  const agentId = req.params.agentId;
 main
  const agent = agents.get(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
 codex/summarize-call-center-gamification-features-ffji8f
  const agentCalls = callsByAgent.get(agentId) || [];

  const agentCalls = calls.filter(c => c.agentId === agentId);
 main
  res.json({ agent, calls: agentCalls });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

 codex/summarize-call-center-gamification-features-ffji8f
function resetData() {
  agents.clear();
  callsByAgent.clear();
  processedCalls.clear();
}

module.exports = { app, resetData };

module.exports = app;
 main
