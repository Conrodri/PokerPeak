import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export async function requirePremium(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Fast path: JWT already says premium (common case after fresh login)
  if ((req as any).user?.isPremium === true) {
    next();
    return;
  }
  // Slow path: re-check DB in case isPremium was updated after token was issued
  const userId: string | undefined = (req as any).user?.userId;
  if (!userId) {
    res.status(403).json({ success: false, error: 'Premium subscription required' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } });
    if (user?.isPremium === true) {
      (req as any).user.isPremium = true; // update payload for downstream
      next();
    } else {
      res.status(403).json({ success: false, error: 'Premium subscription required' });
    }
  } catch {
    res.status(403).json({ success: false, error: 'Premium subscription required' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload;
      (req as any).user = payload;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}
