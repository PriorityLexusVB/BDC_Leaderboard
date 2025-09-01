const request = require('supertest');
const { app, initDb } = require('../src/server');
const { sequelize } = require('../src/db');
const { computePoints } = require('../src/gamification');
const crypto = require('crypto');

process.env.DATABASE_URL = 'sqlite::memory:';
process.env.WEBHOOK_SECRET = 'testsecret';

beforeAll(async () => {
  await initDb();
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

test('webhook awards points and leaderboard returns data', async () => {
  const payload = {
    agent: { id: 'agent1', first_name: 'Test', last_name: 'Agent' },
    call: { id: 'call1', duration: 120, response_time: 10 },
    scored_call: { percentage: 80, opportunity: true },
  };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(200);

  const lbRes = await request(app).get('/api/leaderboard').expect(200);
  expect(Array.isArray(lbRes.body.leaderboard)).toBe(true);
  expect(lbRes.body.leaderboard[0].id).toBe('agent1');
});

test('agent dashboard returns agent data and calls', async () => {
  const payload = {
    agent: { id: 'agent2' },
    call: { id: 'call2', duration: 60 },
    scored_call: { percentage: 50 },
  };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(200);

  const dashRes = await request(app)
    .get('/api/agents/agent2/dashboard')
    .expect(200);
  expect(dashRes.body.agent.id).toBe('agent2');
  expect(dashRes.body.calls.length).toBe(1);
});

test('webhook without agent id returns 400', async () => {
  const payload = { call: { id: 'call3' } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(400);
});

test('duplicate webhook does not double count', async () => {
  const payload = {
    agent: { id: 'agent3' },
    call: { id: 'dupCall', duration: 30 },
    scored_call: { percentage: 70 },
  };
  const expectedPoints = computePoints(payload);
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(200);
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(200);

  const lbRes = await request(app).get('/api/leaderboard').expect(200);
  const agent = lbRes.body.leaderboard.find((a) => a.id === 'agent3');
  expect(agent.totalPoints).toBe(expectedPoints);
});

test('numeric agent id is rejected', async () => {
  const payload = {
    agent: { id: 123 },
    call: { id: 'numCall', duration: 30 },
    scored_call: { percentage: 60 },
  };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(400);
});
