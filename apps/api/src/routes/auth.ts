import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { comparePassword } from '../utils/password';

export const auth = Router();               // <-- named export
const prisma = new PrismaClient();

auth.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const mgr = await prisma.manager.findUnique({ where: { email } });
  if (!mgr) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await comparePassword(password, mgr.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'JWT not configured' });

  const token = jwt.sign({ sub: mgr.id, email: mgr.email, role: 'manager' }, secret, { expiresIn: '12h' });
  res.json({ token });
});
