import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  userId?: number;
}

export function signToken(userId: number): string {
  // @ts-expect-error jsonwebtoken v9 types narrow expiresIn; string like "7d" is valid
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: token hilang' });
  }
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as unknown as { sub: number };
    req.userId = Number(payload.sub);
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: token tidak valid' });
  }
}
