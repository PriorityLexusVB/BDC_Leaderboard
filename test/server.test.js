 codex/summarize-call-center-gamification-features-b0d3sd
const request = require('supertest');
const { app, resetData } = require('../src/server');
const { computePoints } = require('../src/gamification');

describe('API', () => {
  beforeEach(() => {
    resetData();
  });

  test('webhook awards points and leaderboard returns data', async () => {
    await request(app)
      .post('/api/webhooks/calldrip')
      .send({
        agent: { id: 'agent1', first_name: 'Test', last_name: 'Agent' },
        call: { id: 'call1', duration: 120, response_time: 10 },
        scored_call: { percentage: 80, opportunity: true }
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
        scored_call: { percentage: 50 }
      })
      .expect(200);

    const dashRes = await request(app).get('/api/agents/agent2/dashboard').expect(200);
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
      scored_call: { percentage: 70 }
    };
    const expectedPoints = computePoints(payload);
    await request(app).post('/api/webhooks/calldrip').send(payload).expect(200);
    await request(app).post('/api/webhooks/calldrip').send(payload).expect(200);

    const lbRes = await request(app).get('/api/leaderboard').expect(200);
    const agent = lbRes.body.leaderboard.find(a => a.id === 'agent3');
    expect(agent.totalPoints).toBe(expectedPoints);
  });

  test('numeric agent id is handled correctly', async () => {
    await request(app)
      .post('/api/webhooks/calldrip')
      .send({
        agent: { id: 123 },
        call: { id: 'numCall', duration: 30 },
        scored_call: { percentage: 60 }
      })
      .expect(200);

    const res = await request(app).get('/api/agents/123/dashboard').expect(200);
    expect(res.body.agent.id).toBe('123');
    expect(res.body.calls.length).toBe(1);
  });

const test = require('node:test');
const request = require('supertest');
const crypto = require('crypto');

process.env.DATABASE_URL = 'sqlite::memory:';
process.env.WEBHOOK_SECRET = 'testsecret';

const { app, initDb } = require('../src/server');

test.before(async () => {
  await initDb();
});

test.after(async () => {
  const { sequelize } = require('../src/db');
  await sequelize.close();
});

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

const validPayload = {
  agent: { id: 'agent-valid', first_name: 'Test', last_name: 'Agent' },
  call: { id: 'call-valid', duration: 120, response_time: 10 },
  scored_call: { percentage: 80, opportunity: true }
};

test('accepts valid payload', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(validPayload))
    .send(validPayload)
    .expect(200);
});

test('rejects string call.duration', async () => {
  const payload = { agent: { id: 'agent-duration-type' }, call: { id: 'call1', duration: 'long' } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(400);
});

test('rejects negative call.duration', async () => {
  const payload = { agent: { id: 'agent-duration-range' }, call: { id: 'call2', duration: -5 } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(400);
});

test('rejects string call.response_time', async () => {
  const payload = { agent: { id: 'agent-response-type' }, call: { id: 'call3', response_time: 'fast' } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(400);
});

test('rejects negative call.response_time', async () => {
  const payload = { agent: { id: 'agent-response-range' }, call: { id: 'call4', response_time: -1 } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(400);
});

test('rejects string scored_call.percentage', async () => {
  const payload = { agent: { id: 'agent-percentage-type' }, call: { id: 'call5' }, scored_call: { percentage: 'high' } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(400);
});

test('rejects scored_call.percentage over 100', async () => {
  const payload = { agent: { id: 'agent-percentage-range' }, call: { id: 'call6' }, scored_call: { percentage: 150 } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(400);
});

test('rejects invalid signature', async () => {
  const payload = { agent: { id: 'agent-bad-sig' }, call: { id: 'call7' } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', 'bad-signature')
    .send(payload)
    .expect(401);
 main
});
