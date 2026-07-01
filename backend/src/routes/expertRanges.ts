import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getExpertRange, saveExpertRange, deleteExpertRange } from '../controllers/expertRangesController';

const router = Router();

router.use(requireAuth);

router.get('/:position',    getExpertRange);
router.put('/:position',    saveExpertRange);
router.delete('/:position', deleteExpertRange);

export default router;
