import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getSubscription, downgradeToPremium, cancelSubscription } from '../controllers/subscriptionController';

const router = Router();

router.get('/',          requireAuth, getSubscription);
router.post('/downgrade', requireAuth, downgradeToPremium);
router.post('/cancel',    requireAuth, cancelSubscription);

export default router;
