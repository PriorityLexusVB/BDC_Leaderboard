# BDC Leaderboard – Phase 1 Harden & UI

This adds a production‑minded backend rules engine + minimal React UI without breaking local dev.

## Structure
- `apps/api` – Express (TS) + Prisma (SQLite dev / Postgres prod)
- `apps/web` – Vite + React + React Query
- `.github/workflows/ci.yml` – Build API & Web on PR

## Quick Start (dev)
```bash
# 1) API
cd apps/api
cp .env.example .env
npm i
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev

# 2) Web
cd ../../apps/web
npm i
npm run dev
```
API on :8080 (default), Web on :5173.

## Test the webhook
```bash
curl -X POST http://localhost:8080/api/webhooks/calldrip   -H 'Content-Type: application/json'   -H 'X-Webhook-Secret: change_me'   -d '{
    "agent":{"id":"a1","first_name":"Alex","last_name":"Lee"},
    "call":{"id":"c1","duration":200,"response_time":12,"status":"answered","date_received":"2025-09-01T13:00:00Z"},
    "scored_call":{"percentage":95,"is_goal":true,"opportunity":true,"appointmentDate":"2025-09-02"}
  }'
```
Then visit `http://localhost:8080/api/leaderboard` and open the web app at `http://localhost:5173/`.

## Env Vars (apps/api/.env.example)
- `WEBHOOK_SECRET` – required for webhook auth
- `DATABASE_URL` – `sqlite:./dev.sqlite` (dev) or Postgres URI in prod
- `CORS_ORIGIN` – e.g., `http://localhost:5173`
- `CALLDRIP_API_BASE`, `CALLDRIP_API_KEY`, `CALLDRIP_ACCOUNT_ID` – optional for backfill

## Production
- Point DATABASE_URL to Postgres (Supabase/Render)
- `npx prisma migrate deploy`
- Deploy API (Render/Heroku/GCP). Deploy Web (Vercel/Netlify) with `VITE_API_BASE` pointing to your API.

