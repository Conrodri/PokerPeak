import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

function subTier(isPremium: boolean, isPremiumExpert: boolean, premiumUntil: Date | null, premiumExpertUntil: Date | null) {
  const now = new Date();
  const expOk  = isPremiumExpert && (premiumExpertUntil === null || premiumExpertUntil > now);
  const premOk = isPremium       && (premiumUntil       === null || premiumUntil       > now);
  if (expOk)  return 'expert'  as const;
  if (premOk) return 'premium' as const;
  return 'free' as const;
}

export async function getSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse); return; }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true, isPremiumExpert: true,
        premiumSince: true, premiumUntil: true,
        premiumExpertSince: true, premiumExpertUntil: true,
      },
    });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' } as ApiResponse); return; }

    const tier = subTier(user.isPremium, user.isPremiumExpert, user.premiumUntil, user.premiumExpertUntil);

    res.json({
      success: true,
      data: {
        tier,
        isPremium: user.isPremium,
        isPremiumExpert: user.isPremiumExpert,
        premiumSince: user.premiumSince,
        premiumUntil: user.premiumUntil,
        premiumExpertSince: user.premiumExpertSince,
        premiumExpertUntil: user.premiumExpertUntil,
      },
    } as ApiResponse);
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch subscription' } as ApiResponse);
  }
}

/** Downgrade expert → premium (keeps premiumSince/Until, clears expert fields). */
export async function downgradeToPremiun(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse); return; }

    await prisma.user.update({
      where: { id: userId },
      data: { isPremiumExpert: false, premiumExpertUntil: new Date(), premiumExpertSince: null },
    });
    res.json({ success: true, data: { tier: 'premium' } } as ApiResponse);
  } catch {
    res.status(500).json({ success: false, error: 'Failed to downgrade' } as ApiResponse);
  }
}

/** Cancel all subscriptions (sets both Until dates to now). */
export async function cancelSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse); return; }

    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false, premiumUntil: now,
        isPremiumExpert: false, premiumExpertUntil: now,
      },
    });
    res.json({ success: true, data: { tier: 'free' } } as ApiResponse);
  } catch {
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' } as ApiResponse);
  }
}
