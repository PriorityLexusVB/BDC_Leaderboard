const request = require('supertest');
const crypto = require('crypto');

process.env.DATABASE_URL = 'sqlite::memory:';
process.env.WEBHOOK_SECRET = 'testsecret';

const { app, initDb } = require('../src/server');
const { Agent, Call, sequelize } = require('../src/db');
const { computePoints } = require('../src/gamification');

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

beforeAll(async () => {
  await initDb();
});

afterAll(async () => {
  await sequelize.close();
});

test('ignores duplicate calls with same externalId', async () => {
  const payload = {
    agent: { id: 'dup-agent', first_name: 'Dup', last_name: 'Agent' },
    call: { id: 'call-123', duration: 120, response_time: 10 },
    scored_call: { percentage: 80, opportunity: true },
  };

  const signature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', signature)
    .send(payload)
    .expect(200);

  const second = await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', signature)
    .send(payload)
    .expect(200);

  expect(second.body.pointsAwarded).toBe(0);

  const agent = await Agent.findByPk('dup-agent');
  const expected = computePoints(payload);
  expect(agent.totalPoints).toBe(expected);

  const calls = await Call.count();
  expect(calls).toBe(1);
});
