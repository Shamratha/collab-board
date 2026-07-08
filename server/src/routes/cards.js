import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadCard } from '../middleware/resourceAccess.js';
import { updateCard, deleteCard } from '../controllers/cardController.js';

const router = Router();
router.use(requireAuth);

// Any board member may edit and move cards.
router.patch('/:cardId', loadCard, updateCard);
router.delete('/:cardId', loadCard, deleteCard);

export default router;
