const test = require('node:test');
const assert = require('assert/strict');
const request = require('supertest');
const crypto = require('crypto');

process.env.DATABASE_URL = 'sqlite:test-persistence.db';
process.env.WEBHOOK_SECRET = 'testsecret';

// Module scope references; will be reloaded to simulate restart
const serverPath = '../src/server';
let { app, initDb } = require(serverPath);

// Helper to sign payloads
function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

test('persists data across restart', async () => {
  await initDb();

  const payload = {
    agent: { id: 'agent1', first_name: 'Test', last_name: 'Agent' },
    call: { id: 'call1', duration: 120, response_time: 10 },
    scored_call: { percentage: 80, opportunity: true }
  };

  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', sign(payload))
    .send(payload)
    .expect(200);

  let res = await request(app).get('/api/leaderboard').expect(200);
  assert.ok(Array.isArray(res.body.leaderboard) && res.body.leaderboard.length > 0);

  // Simulate server restart by reloading module and re-initialising DB
  [serverPath, '../src/db'].map(require.resolve).forEach(id => delete require.cache[id]);
  ({ app, initDb } = require(serverPath));
  await initDb();

  res = await request(app).get('/api/leaderboard').expect(200);
  assert.strictEqual(res.body.leaderboard[0].id, 'agent1');

  const { sequelize } = require('../src/db');
  await sequelize.close();
});