import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadBoard, requireRole } from '../middleware/boardAccess.js';
import {
  listBoards,
  createBoard,
  getBoard,
  getActivity,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
} from '../controllers/boardController.js';
import { createList } from '../controllers/listController.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

// Every board route requires a logged-in user.
router.use(requireAuth);

router.get('/', listBoards);
router.post('/', validate(schemas.createBoard), createBoard);

// Routes scoped to a specific board authorize via loadBoard (membership)
// and requireRole (owner-only actions).
router.get('/:boardId', loadBoard, getBoard);
router.get('/:boardId/activity', loadBoard, getActivity);
router.patch('/:boardId', loadBoard, requireRole('owner'), validate(schemas.updateBoard), updateBoard);
router.delete('/:boardId', loadBoard, requireRole('owner'), deleteBoard);

// Any member may add a list to the board.
router.post(
  '/:boardId/lists',
  loadBoard,
  requireRole('member'),
  validate(schemas.createList),
  createList
);

router.post(
  '/:boardId/members',
  loadBoard,
  requireRole('owner'),
  validate(schemas.addMember),
  addMember
);
router.delete(
  '/:boardId/members/:userId',
  loadBoard,
  requireRole('owner'),
  removeMember
);

export default router;
