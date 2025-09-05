import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

export const auth = express.Router();
const prisma = new PrismaClient();
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

auth.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const mgr = await prisma.manager.findUnique({ where: { email } });
    if (!mgr || mgr.password_hash !== sha256(password)) return res.status(401).json({ error: "invalid credentials" });

    const token = jwt.sign(
      { sub: mgr.id, email: mgr.email, role: "manager" },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "12h" }
    );
    res.json({ token });
  } catch (e) { next(e); }
});