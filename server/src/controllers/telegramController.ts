import type { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import type { AuthRequest } from '../middlewares/auth.js';
import { buildDeepLink } from '../services/botService.js';
import { env } from '../config/env.js';

function newLinkToken(): string {
  return `LINK_${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

// GET /api/telegram/link-token — buat token sekali pakai + deep link
export async function getLinkToken(req: AuthRequest, res: Response) {
  const link_token = newLinkToken();
  await prisma.user.update({ where: { id: req.userId! }, data: { link_token } });
  res.json({ link_token, url: buildDeepLink(link_token), bot_username: env.botUsername });
}

// GET /api/telegram/status — cek status linking
export async function getStatus(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { telegram_chat_id: true, link_token: true },
  });
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  res.json({
    linked: !!user.telegram_chat_id,
    telegram_chat_id: user.telegram_chat_id,
    bot_username: env.botUsername,
    bot_configured: !!env.botToken,
    pending_token: user.link_token
      ? { link_token: user.link_token, url: buildDeepLink(user.link_token) }
      : null,
  });
}

// POST /api/telegram/unlink — lepas telegram_chat_id
export async function unlink(req: AuthRequest, res: Response) {
  await prisma.user.update({
    where: { id: req.userId! },
    data: { telegram_chat_id: null, link_token: null },
  });
  res.json({ ok: true });
}
