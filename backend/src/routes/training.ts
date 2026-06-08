import { Router } from 'express';
import {
  getPreflopExercise, checkPreflopAnswer,
  getPotOddsExercise, checkPotOddsAnswer,
  getEquityExercise, getOutsExercise, getBBDefenseExercise, getBBDefenseRange,
  getRangeData, startSession, recordClientResult,
} from '../controllers/trainingController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

router.post('/session/start', startSession);
router.post('/record', recordClientResult);

// Pre-flop
router.get('/preflop/exercise', getPreflopExercise);
router.post('/preflop/check', checkPreflopAnswer);
router.get('/preflop/range/:position', getRangeData);

// Pot odds
router.get('/potodds/exercise', getPotOddsExercise);
router.post('/potodds/check', checkPotOddsAnswer);

// Equity
router.get('/equity/exercise', getEquityExercise);

// Outs
router.get('/outs/exercise', getOutsExercise);

// BB defense
router.get('/bbdefense/exercise', getBBDefenseExercise);
router.get('/bbdefense/range', getBBDefenseRange);

export default router;
