import { Router } from 'express';
import { requireAuth, requirePremium, optionalAuth } from '../middleware/auth';
import {
  getCustomRange, saveCustomRange, deleteCustomRange,
  getDefaultRanges,
  listPresets, createPreset, updatePreset, deletePreset,
  activatePreset, getActivePreset,
} from '../controllers/rangesController';

const router = Router();

// ── Specific named routes first (must precede /:position wildcard) ────────────

// GTO defaults — requires auth only (no premium needed — it's just public GTO data)
router.get('/defaults',               requireAuth, getDefaultRanges);

// Active preset — used by trainers to decide which range to display
router.get('/presets/active',         requireAuth, requirePremium, getActivePreset);

// Preset CRUD
router.get('/presets',                requireAuth, requirePremium, listPresets);
router.post('/presets',               requireAuth, requirePremium, createPreset);
router.put('/presets/:id',            requireAuth, requirePremium, updatePreset);
router.delete('/presets/:id',         requireAuth, requirePremium, deletePreset);
router.post('/presets/:id/activate',  requireAuth, requirePremium, activatePreset);

// ── Per-position custom range (premium) ──────────────────────────────────────
router.get('/:position',    requireAuth, requirePremium, getCustomRange);
router.put('/:position',    requireAuth, requirePremium, saveCustomRange);
router.delete('/:position', requireAuth, requirePremium, deleteCustomRange);

export default router;
