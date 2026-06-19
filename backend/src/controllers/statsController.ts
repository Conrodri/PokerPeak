import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export async function getMyStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const stats = await prisma.playerStats.findUnique({ where: { userId } });
    const recentSessions = await prisma.trainingSession.findMany({
      where: { userId },
      include: { exercises: { select: { isCorrect: true, exerciseType: true, createdAt: true } } },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    // Calculate accuracy per module from recent sessions
    const moduleStats: Record<string, { total: number; correct: number }> = {};
    for (const session of recentSessions) {
      for (const ex of session.exercises) {
        if (!moduleStats[ex.exerciseType]) {
          moduleStats[ex.exerciseType] = { total: 0, correct: 0 };
        }
        moduleStats[ex.exerciseType].total++;
        if (ex.isCorrect) moduleStats[ex.exerciseType].correct++;
      }
    }

    res.json({
      success: true,
      data: { stats, moduleStats, recentSessions },
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' } as ApiResponse);
  }
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const leaders = await prisma.playerStats.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true } },
      },
    });

    const acc = (correct: number, total: number) =>
      total > 0 ? Math.round((correct / total) * 100) : null;

    const formatted = leaders.map((l, i) => ({
      rank: i + 1,
      username: l.user.username,
      xp: l.xp,
      level: l.level,
      totalExercises: l.totalExercises,
      accuracy: l.totalExercises > 0 ? Math.round((l.totalCorrect / l.totalExercises) * 100) : 0,
      modules: {
        preflop:  { accuracy: acc(l.preflopCorrect,  l.preflopTotal),  total: l.preflopTotal,  bestStreak: l.preflopBest  },
        potodds:  { accuracy: acc(l.potoddsCorrect,  l.potoddsTotal),  total: l.potoddsTotal,  bestStreak: l.potoddssBest },
        equity:   { accuracy: acc(l.equityCorrect,   l.equityTotal),   total: l.equityTotal,   bestStreak: l.equityBest   },
        outs:     { accuracy: acc(l.outsCorrect,     l.outsTotal),     total: l.outsTotal,     bestStreak: l.outsBest     },
        postflop: { accuracy: acc(l.postflopCorrect, l.postflopTotal), total: l.postflopTotal, bestStreak: l.postflopBest },
        fullhand: { accuracy: acc(l.fullhandCorrect, l.fullhandTotal), total: l.fullhandTotal, bestStreak: l.fullhandBest },
      },
    }));

    res.json({ success: true, data: formatted } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get leaderboard' } as ApiResponse);
  }
}

export async function getProgressHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const exercises = await prisma.sessionExercise.findMany({
      where: {
        session: { userId },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        exerciseType: true,
        isCorrect: true,
        xpEarned: true,
        timeTaken: true,
        createdAt: true,
      },
    });

    // Group by day
    const byDay: Record<string, { total: number; correct: number; xp: number }> = {};
    for (const ex of exercises) {
      const day = ex.createdAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { total: 0, correct: 0, xp: 0 };
      byDay[day].total++;
      if (ex.isCorrect) byDay[day].correct++;
      byDay[day].xp += ex.xpEarned;
    }

    res.json({ success: true, data: { byDay, exercises } } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get history' } as ApiResponse);
  }
}
