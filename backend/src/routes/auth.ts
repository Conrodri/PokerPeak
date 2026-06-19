import { Router } from 'express';
import { register, login, getMe, dismissTutorial } from '../controllers/authController';
import { googleLogin, googleCallback } from '../controllers/googleAuthController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.patch('/dismiss-tutorial', requireAuth, dismissTutorial);
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

export default router;
