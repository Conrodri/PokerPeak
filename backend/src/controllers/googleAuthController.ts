import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_EXPIRES = '30d';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export function googleLogin(_req: Request, res: Response): void {
  if (!CLIENT_ID) {
    res.status(503).json({ success: false, error: 'Google OAuth not configured' });
    return;
  }
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  res.redirect(url.toString());
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const { code, error } = req.query as { code?: string; error?: string };

  if (error || !code) {
    res.redirect(`${FRONTEND_URL}/login?error=google_cancelled`);
    return;
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokens = await tokenRes.json() as { access_token: string };

    // Get Google user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    const gUser = await userInfoRes.json() as {
      id: string;
      email: string;
      name: string;
      given_name?: string;
      picture?: string;
    };

    // Find existing user by Google ID or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: gUser.id }, { email: gUser.email }] },
    });

    if (user) {
      // Link Google ID + refresh avatar if needed
      const updates: Record<string, unknown> = {};
      if (!user.googleId) updates.googleId = gUser.id;
      if (gUser.picture && user.avatarUrl !== gUser.picture) updates.avatarUrl = gUser.picture;
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updates });
      }
    } else {
      // Build a unique username from Google display name
      let base = (gUser.given_name || gUser.name || gUser.email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 18) || 'user';

      let username = base;
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) username = base + Math.floor(Math.random() * 9000 + 1000);

      user = await prisma.user.create({
        data: { username, email: gUser.email, password: null, googleId: gUser.id, avatarUrl: gUser.picture ?? null },
      });
      await prisma.playerStats.create({ data: { userId: user.id } });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, isPremium: user.isPremium, isPremiumExpert: user.isPremiumExpert } as JwtPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('[Google OAuth]', err);
    res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }
}
