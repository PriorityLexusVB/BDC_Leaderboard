const request = require('supertest');
const crypto = require('crypto');

process.env.DATABASE_URL = 'sqlite::memory:';
process.env.WEBHOOK_SECRET = 'testsecret';

const { app, initDb } = require('../src/server');
const { sequelize } = require('../src/db');

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

const validPayload = {
  agent: { id: 'agent-valid', first_name: 'Test', last_name: 'Agent' },
  call: { id: 'call-valid', duration: 120, response_time: 10 },
  scored_call: { percentage: 80, opportunity: true },
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
});
