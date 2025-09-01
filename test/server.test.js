const request = require('supertest');
const { app, initDb } = require('../src/server');
const { sequelize } = require('../src/db');
const { computePoints } = require('../src/gamification');

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

test('webhook awards points and leaderboard returns data', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({
      agent: { id: 'agent1', first_name: 'Test', last_name: 'Agent' },
      call: { id: 'call1', duration: 120, response_time: 10 },
      scored_call: { percentage: 80, opportunity: true },
    })
    .expect(200);

  const lbRes = await request(app).get('/api/leaderboard').expect(200);
  expect(Array.isArray(lbRes.body.leaderboard)).toBe(true);
  expect(lbRes.body.leaderboard[0].id).toBe('agent1');
});

test('agent dashboard returns agent data and calls', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({
      agent: { id: 'agent2' },
      call: { id: 'call2', duration: 60 },
      scored_call: { percentage: 50 },
    })
    .expect(200);

  const dashRes = await request(app)
    .get('/api/agents/agent2/dashboard')
    .expect(200);
  expect(dashRes.body.agent.id).toBe('agent2');
  expect(dashRes.body.calls.length).toBe(1);
});

test('webhook without agent id returns 400', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({ call: { id: 'call3' } })
    .expect(400);
});

test('duplicate webhook does not double count', async () => {
  const payload = {
    agent: { id: 'agent3' },
    call: { id: 'dupCall', duration: 30 },
    scored_call: { percentage: 70 },
  };
  const expectedPoints = computePoints(payload);
  await request(app).post('/api/webhooks/calldrip').send(payload).expect(200);
  await request(app).post('/api/webhooks/calldrip').send(payload).expect(200);

  const lbRes = await request(app).get('/api/leaderboard').expect(200);
  const agent = lbRes.body.leaderboard.find((a) => a.id === 'agent3');
  expect(agent.totalPoints).toBe(expectedPoints);
});

test('numeric agent id is handled correctly', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({
      agent: { id: 123 },
      call: { id: 'numCall', duration: 30 },
      scored_call: { percentage: 60 },
    })
    .expect(200);

  const res = await request(app).get('/api/agents/123/dashboard').expect(200);
  expect(res.body.agent.id).toBe('123');
  expect(res.body.calls.length).toBe(1);
});
