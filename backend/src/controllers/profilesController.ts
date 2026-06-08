import { Request, Response } from 'express';
import prisma from '../config/database';
import { getRangeMatrix } from '../services/poker/ranges';
import { Position } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(req: Request): string {
  return (req as any).user?.userId as string;
}

type StackRangeRow = {
  id: string; profileId: string; label: string;
  stackMin: number; stackMax: number | null;
  sortOrder: number; data: string;
  createdAt: Date; updatedAt: Date;
};

function parseProfile(p: {
  id: string; userId: string; name: string;
  isActive: boolean; sortOrder: number;
  createdAt: Date; updatedAt: Date;
  stackRanges?: StackRangeRow[];
}) {
  return {
    ...p,
    stackRanges: (p.stackRanges ?? []).map(sr => ({
      ...sr,
      data: JSON.parse(sr.data) as Record<string, number[]>,
    })).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

// ─── Profile CRUD ─────────────────────────────────────────────────────────────

// GET /profiles
export async function listProfiles(req: Request, res: Response): Promise<void> {
  try {
    const profiles = await prisma.rangeProfile.findMany({
      where: { userId: uid(req) },
      include: { stackRanges: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: profiles.map(parseProfile) });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to list profiles' });
  }
}

// POST /profiles   body: { name }
export async function createProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = uid(req);
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, error: 'name is required' });
      return;
    }
    const count = await prisma.rangeProfile.count({ where: { userId } });
    const profile = await prisma.rangeProfile.create({
      data: { userId, name: name.trim(), sortOrder: count },
      include: { stackRanges: true },
    });
    res.json({ success: true, data: parseProfile(profile) });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create profile' });
  }
}

// PUT /profiles/:id   body: { name }
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = uid(req);
    const { id } = req.params;
    const { name } = req.body;
    const existing = await prisma.rangeProfile.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Profile not found' }); return; }
    const updated = await prisma.rangeProfile.update({
      where: { id },
      data: { ...(typeof name === 'string' && { name: name.trim() }) },
      include: { stackRanges: true },
    });
    res.json({ success: true, data: parseProfile(updated) });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
}

// DELETE /profiles/:id
export async function deleteProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = uid(req);
    const { id } = req.params;
    await prisma.rangeProfile.deleteMany({ where: { id, userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete profile' });
  }
}

// POST /profiles/:id/activate
export async function activateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = uid(req);
    const { id } = req.params;
    // Deactivate all profiles for this user first
    await prisma.rangeProfile.updateMany({ where: { userId }, data: { isActive: false } });
    if (id !== 'none') {
      const count = await prisma.rangeProfile.updateMany({
        where: { id, userId }, data: { isActive: true },
      });
      if (count.count === 0) {
        res.status(404).json({ success: false, error: 'Profile not found' }); return;
      }
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to activate profile' });
  }
}

// ─── Stack Range CRUD ─────────────────────────────────────────────────────────

// POST /profiles/:profileId/ranges   body: { label, stackMin, stackMax }
export async function createStackRange(req: Request, res: Response): Promise<void> {
  try {
    const userId = uid(req);
    const { profileId } = req.params;
    const profile = await prisma.rangeProfile.findFirst({ where: { id: profileId, userId } });
    if (!profile) { res.status(404).json({ success: false, error: 'Profile not found' }); return; }

    const { label, stackMin = 0, stackMax = null } = req.body;
    if (!label || typeof label !== 'string') {
      res.status(400).json({ success: false, error: 'label is required' }); return;
    }

    // Pre-fill data with GTO ranges as a starting point
    const ALL_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    const gtoData: Record<string, number[]> = {};
    for (const pos of ALL_POSITIONS) {
      gtoData[pos] = getRangeMatrix(pos).flat();
    }

    const count = await prisma.rangeStackRange.count({ where: { profileId } });
    const sr = await prisma.rangeStackRange.create({
      data: {
        profileId,
        label: label.trim(),
        stackMin: typeof stackMin === 'number' ? stackMin : 0,
        stackMax: typeof stackMax === 'number' ? stackMax : null,
        sortOrder: count,
        data: JSON.stringify(gtoData),
      },
    });
    res.json({ success: true, data: { ...sr, data: JSON.parse(sr.data) } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create stack range' });
  }
}

// PUT /profiles/:profileId/ranges/:rangeId   body: { label?, stackMin?, stackMax?, data?, position?, cells? }
export async function updateStackRange(req: Request, res: Response): Promise<void> {
  try {
    const userId = uid(req);
    const { profileId, rangeId } = req.params;
    const profile = await prisma.rangeProfile.findFirst({ where: { id: profileId, userId } });
    if (!profile) { res.status(404).json({ success: false, error: 'Profile not found' }); return; }

    const existing = await prisma.rangeStackRange.findFirst({ where: { id: rangeId, profileId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Stack range not found' }); return; }

    const { label, stackMin, stackMax, data, position, cells } = req.body;

    let newData: Record<string, number[]> | undefined;

    if (data && typeof data === 'object') {
      // Full data replacement
      newData = data;
    } else if (position && Array.isArray(cells) && cells.length === 169) {
      // Partial update: only one position
      const current: Record<string, number[]> = JSON.parse(existing.data);
      current[position] = cells;
      newData = current;
    }

    const updated = await prisma.rangeStackRange.update({
      where: { id: rangeId },
      data: {
        ...(typeof label    === 'string'  && { label: label.trim() }),
        ...(typeof stackMin === 'number'  && { stackMin }),
        ...(stackMax !== undefined        && { stackMax: typeof stackMax === 'number' ? stackMax : null }),
        ...(newData                       && { data: JSON.stringify(newData) }),
      },
    });
    res.json({ success: true, data: { ...updated, data: JSON.parse(updated.data) } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update stack range' });
  }
}

// DELETE /profiles/:profileId/ranges/:rangeId
export async function deleteStackRange(req: Request, res: Response): Promise<void> {
  try {
    const userId = uid(req);
    const { profileId, rangeId } = req.params;
    const profile = await prisma.rangeProfile.findFirst({ where: { id: profileId, userId } });
    if (!profile) { res.status(404).json({ success: false, error: 'Profile not found' }); return; }
    await prisma.rangeStackRange.deleteMany({ where: { id: rangeId, profileId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete stack range' });
  }
}

// ─── Resolve — used by trainers during exercise evaluation ────────────────────

// GET /profiles/resolve?position=BTN&stack=35
// Returns the flat 169-cell array for the active profile at the given stack depth.
// Falls back to the simple CustomRange if no profile is active.
export async function resolveRange(req: Request, res: Response): Promise<void> {
  try {
    const userId = uid(req);
    const position = req.query.position as string;
    const stack    = parseFloat(req.query.stack as string);

    if (!position) {
      res.status(400).json({ success: false, error: 'position is required' }); return;
    }

    const activeProfile = await prisma.rangeProfile.findFirst({
      where: { userId, isActive: true },
      include: { stackRanges: { orderBy: { stackMin: 'asc' } } },
    });

    if (!activeProfile || activeProfile.stackRanges.length === 0) {
      // No active profile → fall back to simple CustomRange
      const cr = await prisma.customRange.findUnique({
        where: { userId_position: { userId, position } },
      });
      res.json({ success: true, data: { cells: cr ? JSON.parse(cr.cells) : null, source: 'custom' } });
      return;
    }

    // Find the stack range that matches the requested stack depth
    const match = activeProfile.stackRanges.find(sr => {
      const aboveMin = isNaN(stack) || stack >= sr.stackMin;
      const belowMax = sr.stackMax === null || isNaN(stack) || stack < sr.stackMax;
      return aboveMin && belowMax;
    }) ?? activeProfile.stackRanges[activeProfile.stackRanges.length - 1]; // fallback to last

    const data: Record<string, number[]> = JSON.parse(match.data);
    const cells = data[position] ?? null;

    res.json({
      success: true,
      data: {
        cells,
        source: 'profile',
        profileName: activeProfile.name,
        stackRangeLabel: match.label,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to resolve range' });
  }
}
