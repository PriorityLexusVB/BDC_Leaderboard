import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { limiterPublic, limiterAdmin } from "./middleware/rateLimit";
import { webhooks } from "./routes/webhooks";
import { leaderboard } from "./routes/leaderboard";
import { agents } from "./routes/agents";
import { admin } from "./routes/admin";
import { auth } from "./routes/auth";
import { challenges } from "./routes/challenges";
import { teams } from "./routes/teams";
import metrics from "./routes/metrics";
import { teams } from "./routes/teams";

const app = express();
const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:5173"];

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "connect-src": ["'self'", "http://localhost:5173"],
      "img-src": ["'self'", "data:"],
      "style-src": ["'self'", "https:", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Public
app.use("/api/webhooks", limiterPublic, webhooks);
app.use("/api/leaderboard", limiterPublic, leaderboard);
app.use("/api/agents", limiterPublic, agents);
app.use("/api/auth", limiterPublic, auth);
app.use("/api/challenges", limiterPublic, challenges);
app.use("/api/metrics", limiterPublic, metrics);
app.use("/api/teams", limiterPublic, teams);

// Admin
app.use("/api/admin", limiterAdmin, admin);
app.use("/api/admin/teams", limiterAdmin, teams);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log(`API on :${port}`));

