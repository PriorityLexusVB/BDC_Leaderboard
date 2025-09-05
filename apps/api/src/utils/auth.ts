import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_only_change_me";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

// Shape of the JWT payload we issue/expect
type JwtPayload = {
  sub: number;
  email: string;
  role: "manager" | "user";
  iat?: number;
  exp?: number;
};

/** Sign a manager token (useful for tests or seed flows) */
export function signManagerToken(id: number, email: string, expiresIn: string | number = "12h") {
  const payload: Omit<JwtPayload, "iat" | "exp"> = { sub: id, email, role: "manager" };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/** Express middleware — require a valid manager JWT in Authorization: Bearer <token> */
export function requireManager(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) return res.status(401).json({ error: "missing bearer token" });

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.role !== "manager") {
      return res.status(403).json({ error: "forbidden" });
    }

    // attach for downstream handlers if needed
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "unauthorized", detail: err?.message });
  }
}

/** Verify webhook shared secret via header X-Webhook-Secret OR query ?secret= */
export function verifyWebhookSecret(req: Request): boolean {
  if (!WEBHOOK_SECRET) return true; // if not configured, allow (dev mode)
  const header = (req.headers["x-webhook-secret"] || req.headers["X-Webhook-Secret"]) as string | undefined;
  const fromHeader = header && header.trim();
  const fromQuery = typeof req.query.secret === "string" ? (req.query.secret as string).trim() : undefined;
  return fromHeader === WEBHOOK_SECRET || fromQuery === WEBHOOK_SECRET;
}