import { Request } from 'express';

export function assertWebhookSecret(req: Request) {
  const incoming = req.header('X-Webhook-Secret') || (req.query.secret as string | undefined);
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected || incoming !== expected) {
    const err = new Error('Unauthorized: bad webhook secret') as any;
    err.status = 401;
    throw err;
  }
}
