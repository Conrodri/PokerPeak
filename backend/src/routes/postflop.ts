import { Router } from 'express';
import { requireAuth, requirePremium } from '../middleware/auth';
import { getPostflopExercise, getFullHandScenario } from '../controllers/postflopController';

const router = Router();

router.get('/exercise',  requireAuth, requirePremium, getPostflopExercise);
router.get('/full-hand', requireAuth, requirePremium, getFullHandScenario);

export default router;
