const test = require('node:test');
const request = require('supertest');
const app = require('../src/server');

// Valid payload to ensure baseline functionality
// using unique agent ID
const validPayload = {
  agent: { id: 'agent-valid', first_name: 'Test', last_name: 'Agent' },
  call: { duration: 120, response_time: 10 },
  scored_call: { percentage: 80, opportunity: true }
};

test('accepts valid payload', async () => {
  await request(app).post('/api/webhooks/calldrip').send(validPayload).expect(200);
});

test('rejects string call.duration', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({ agent: { id: 'agent-duration-type' }, call: { duration: 'long' } })
    .expect(400);
});

test('rejects negative call.duration', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({ agent: { id: 'agent-duration-range' }, call: { duration: -5 } })
    .expect(400);
});

test('rejects string call.response_time', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({ agent: { id: 'agent-response-type' }, call: { response_time: 'fast' } })
    .expect(400);
});

test('rejects negative call.response_time', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({ agent: { id: 'agent-response-range' }, call: { response_time: -1 } })
    .expect(400);
});

test('rejects string scored_call.percentage', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({ agent: { id: 'agent-percentage-type' }, scored_call: { percentage: 'high' } })
    .expect(400);
});

test('rejects scored_call.percentage over 100', async () => {
  await request(app)
    .post('/api/webhooks/calldrip')
    .send({ agent: { id: 'agent-percentage-range' }, scored_call: { percentage: 150 } })
    .expect(400);
});
