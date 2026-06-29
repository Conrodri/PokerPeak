import { Router } from 'express';
import { getMyStats, getLeaderboard, getProgressHistory, getUserStats, updateTitle } from '../controllers/statsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/me', requireAuth, getMyStats);
router.get('/history', requireAuth, getProgressHistory);
router.get('/user/:username', getUserStats);
router.put('/title', requireAuth, updateTitle);

export default router;
