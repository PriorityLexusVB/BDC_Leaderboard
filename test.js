const request = require('supertest');
const crypto = require('crypto');

process.env.DATABASE_URL = 'sqlite::memory:';
process.env.WEBHOOK_SECRET = 'testsecret';

async function run() {
  let { app, initDb } = require('./src/server');
  await initDb();

  const payload = {
    agent: { id: 'agent1', first_name: 'Test', last_name: 'Agent' },
    call: { id: 'call1', duration: 120, response_time: 10 },
    scored_call: { percentage: 80, opportunity: true }
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

  let lbRes = await request(app).get('/api/leaderboard').expect(200);
  if (!Array.isArray(lbRes.body.leaderboard) || lbRes.body.leaderboard.length === 0) {
    throw new Error('leaderboard not returned');
  }

  // Simulate server restart
  delete require.cache[require.resolve('./src/server')];
  ({ app, initDb } = require('./src/server'));
  await initDb();
  lbRes = await request(app).get('/api/leaderboard').expect(200);
  if (lbRes.body.leaderboard.length === 0) {
    throw new Error('data not persisted across restart');
  }

  const { sequelize } = require('./src/db');
  await sequelize.close();
}

run();
