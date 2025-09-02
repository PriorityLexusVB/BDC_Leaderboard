import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { webhooks } from './routes/webhooks';
import { leaderboard } from './routes/leaderboard';
import { agents } from './routes/agents';
import { admin } from './routes/admin';

const app = express();
const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'];
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/webhooks', webhooks);
app.use('/api/leaderboard', leaderboard);
app.use('/api/agents', agents);
app.use('/api/admin', admin);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log(`API on :${port}`));
