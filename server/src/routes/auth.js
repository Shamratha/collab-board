import { Router } from 'express';
import { register, login, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
