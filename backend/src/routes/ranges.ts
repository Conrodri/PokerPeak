import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import {
  getCustomRange, saveCustomRange, deleteCustomRange,
  getDefaultRanges,
  listPresets, createPreset, updatePreset, deletePreset,
  activatePreset, getActivePreset,
} from '../controllers/rangesController';

const router = Router();

// ── Specific named routes first (must precede /:position wildcard) ────────────

router.get('/defaults',               optionalAuth, getDefaultRanges);

router.get('/presets/active',         requireAuth, getActivePreset);

router.get('/presets',                requireAuth, listPresets);
router.post('/presets',               requireAuth, createPreset);
router.put('/presets/:id',            requireAuth, updatePreset);
router.delete('/presets/:id',         requireAuth, deletePreset);
router.post('/presets/:id/activate',  requireAuth, activatePreset);

router.get('/:position',    requireAuth, getCustomRange);
router.put('/:position',    requireAuth, saveCustomRange);
router.delete('/:position', requireAuth, deleteCustomRange);

export default router;
