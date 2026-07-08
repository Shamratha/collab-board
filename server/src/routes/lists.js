import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadList } from '../middleware/resourceAccess.js';
import { updateList, deleteList } from '../controllers/listController.js';
import { createCard } from '../controllers/cardController.js';

const router = Router();
router.use(requireAuth);

// Any board member may edit lists and add cards.
router.patch('/:listId', loadList, updateList);
router.delete('/:listId', loadList, deleteList);
router.post('/:listId/cards', loadList, createCard);

export default router;
