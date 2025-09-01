const request = require('supertest');
const crypto = require('crypto');

process.env.DATABASE_URL = 'sqlite::memory:';
process.env.WEBHOOK_SECRET = 'testsecret';

let app;
let initDb;

beforeAll(async () => {
  ({ app, initDb } = require('../src/server'));
  await initDb();
});

afterAll(async () => {
  const { sequelize } = require('../src/db');
  await sequelize.close();
});

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

test('data persists across server restart', async () => {
  const payload = {
    agent: { id: 'agent1', first_name: 'Test', last_name: 'Agent' },
    call: { id: 'call1', duration: 120, response_time: 10 },
    scored_call: { percentage: 80, opportunity: true },
  };
  const signature = sign(payload);

  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', signature)
    .send(payload)
    .expect(200);

  let lbRes = await request(app).get('/api/leaderboard').expect(200);
  expect(Array.isArray(lbRes.body.leaderboard)).toBe(true);
  expect(lbRes.body.leaderboard.length).toBeGreaterThan(0);

  delete require.cache[require.resolve('../src/server')];
  ({ app, initDb } = require('../src/server'));
  await initDb();

  lbRes = await request(app).get('/api/leaderboard').expect(200);
  expect(lbRes.body.leaderboard.length).toBeGreaterThan(0);
});
