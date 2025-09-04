import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Top N winners since a given date */
async function winnersSince(date: Date, limit = 5) {
  const rows: Array<{ id: string; first_name: string | null; last_name: string | null; points: number }> =
    await prisma.$queryRawUnsafe(
      `
      SELECT a.id, a.first_name, a.last_name, COALESCE(SUM(pl.points_awarded), 0) AS points
      FROM "PointsLog" pl
      JOIN "Agent" a ON a.id = pl.agent_id
      WHERE pl."timestamp" >= $1
      GROUP BY a.id, a.first_name, a.last_name
      ORDER BY points DESC
      LIMIT $2;
      `,
      date,
      limit
    );
  return rows;
}

/** Winners in the last 7 days */
export async function weeklyWinnersDigest() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  return winnersSince(since);
}

/** Send winners digest to Slack and/or Email (SMTP) */
export async function sendWinnersDigest() {
  const winners = await weeklyWinnersDigest();

  const lines = winners
    .map((w, i) => `${i + 1}. ${w.first_name ?? ''} ${w.last_name ?? ''} — ${w.points} pts`.trim())
    .join('\n');
  const text = `Weekly Winners (Top 5)\n${lines || 'No data this week yet.'}`;

  // Slack via Incoming Webhook
  const slackHook = process.env.SLACK_WEBHOOK_URL;
  if (slackHook) {
    await fetch(slackHook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  }

  // Email via SMTP
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.NOTIFY_TO;
  const from = process.env.SMTP_FROM || 'no-reply@example.com';
  if (host && user && pass && to) {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to,
      subject: 'Weekly Winners',
      text,
    });
  }

  return { sent: true, winners };
}
