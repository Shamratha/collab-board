import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadList } from '../middleware/resourceAccess.js';
import { updateList, deleteList } from '../controllers/listController.js';
import { createCard } from '../controllers/cardController.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

// Any board member may edit lists and add cards.
router.patch('/:listId', loadList, validate(schemas.updateList), updateList);
router.delete('/:listId', loadList, deleteList);
router.post('/:listId/cards', loadList, validate(schemas.createCard), createCard);

export default router;
