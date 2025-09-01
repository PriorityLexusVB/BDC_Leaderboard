const request = require('supertest');
const app = require('./src/server');

async function run() {
  // send a sample webhook
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({
      agent: { id: 'agent1', first_name: 'Test', last_name: 'Agent' },
      call: { duration: 120, response_time: 10 },
      scored_call: { percentage: 80, opportunity: true }
    })
    .expect(200);

  const lbRes = await request(app).get('/api/leaderboard').expect(200);
  if (!Array.isArray(lbRes.body.leaderboard) || lbRes.body.leaderboard.length === 0) {
    throw new Error('leaderboard not returned');
  }
}

run();
