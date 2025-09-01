process.env.WEBHOOK_SECRET = 'testsecret';
const request = require('supertest');
const app = require('../src/server');

async function run() {
  const payload = { agent: { id: 'agent2' } };
  await request(app)
    .post('/api/webhooks/calldrip')
    .set('X-Signature', 'bad-signature')
    .send(payload)
    .expect(401);
}

run();
