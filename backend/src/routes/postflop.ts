import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { getPostflopExercise, getFullHandScenario } from '../controllers/postflopController';

const router = Router();

router.get('/exercise',  optionalAuth, getPostflopExercise);
router.get('/full-hand', optionalAuth, getFullHandScenario);

export default router;
