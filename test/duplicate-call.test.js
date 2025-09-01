const test = require('node:test');
const assert = require('assert/strict');
const request = require('supertest');
const crypto = require('crypto');

process.env.DATABASE_URL = 'sqlite::memory:';
process.env.WEBHOOK_SECRET = 'testsecret';

const { app, initDb } = require('../src/server');
const { Agent, Call } = require('../src/db');
const { computePoints } = require('../src/gamification');

test('ignores duplicate calls with same externalId', async () => {
  await initDb();

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

  assert.equal(second.body.pointsAwarded, 0);

  const agent = await Agent.findByPk('dup-agent');
  const expected = computePoints(payload);
  assert.equal(agent.totalPoints, expected);

  const calls = await Call.count();
  assert.equal(calls, 1);
});

