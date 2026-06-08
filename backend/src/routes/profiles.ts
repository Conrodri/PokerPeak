import { Router } from 'express';
import { requireAuth, requirePremium } from '../middleware/auth';
import {
  listProfiles, createProfile, updateProfile, deleteProfile, activateProfile,
  createStackRange, updateStackRange, deleteStackRange,
  resolveRange,
} from '../controllers/profilesController';

const router = Router();

// All routes require auth + premium
router.use(requireAuth, requirePremium);

// Resolve (used by trainers during exercise — must come before /:id wildcard)
router.get('/resolve', resolveRange);

// Profile CRUD
router.get('/',                           listProfiles);
router.post('/',                          createProfile);
router.put('/:id',                        updateProfile);
router.delete('/:id',                     deleteProfile);
router.post('/:id/activate',              activateProfile);

// Stack-range CRUD (nested under profile)
router.post('/:profileId/ranges',                      createStackRange);
router.put('/:profileId/ranges/:rangeId',              updateStackRange);
router.delete('/:profileId/ranges/:rangeId',           deleteStackRange);

export default router;
