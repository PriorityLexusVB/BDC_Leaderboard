import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { limiterPublic, limiterAdmin } from './middleware/rateLimit';

import { webhooks } from './routes/webhooks';
import { leaderboard } from './routes/leaderboard';
import { agents } from './routes/agents';
import { auth } from './routes/auth';
import { admin } from './routes/admin';
import { challenges } from './routes/challenges';

const app = express();

// --- Security middleware ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.disable('x-powered-by');

// --- CORS ---
const origins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];
app.use(
  cors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false,
  })
);

// --- Body parser + public rate limit ---
app.use(express.json({ limit: '2mb' }));
app.use(limiterPublic);

// --- Routes ---
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/webhooks', webhooks);
app.use('/api/leaderboard', leaderboard);
app.use('/api/agents', agents);
app.use('/api/auth', auth);

// Admin routes with stricter limiter
app.use('/api/admin', limiterAdmin, admin);

app.use('/api/challenges', challenges);

// --- Error handler ---
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Server error' });
});

// --- Boot ---
const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log(`API on :${port}`));
