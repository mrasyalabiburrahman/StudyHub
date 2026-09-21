import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { signToken, type AuthRequest } from '../middlewares/auth.js';

export async function register(req: AuthRequest, res: Response) {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, password wajib diisi' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email sudah terdaftar' });

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password_hash } });
  const token = signToken(user.id);
  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email & password wajib diisi' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Email/password salah' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Email/password salah' });

  const token = signToken(user.id);
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, name: true, email: true, telegram_chat_id: true, created_at: true },
  });
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  return res.json(user);
}
