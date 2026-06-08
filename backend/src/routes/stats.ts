import { Router } from 'express';
import { getMyStats, getLeaderboard, getProgressHistory } from '../controllers/statsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/me', requireAuth, getMyStats);
router.get('/history', requireAuth, getProgressHistory);

export default router;
