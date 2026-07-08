import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadBoard, requireRole } from '../middleware/boardAccess.js';
import {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
} from '../controllers/boardController.js';
import { createList } from '../controllers/listController.js';

const router = Router();

// Every board route requires a logged-in user.
router.use(requireAuth);

router.get('/', listBoards);
router.post('/', createBoard);

// Routes scoped to a specific board authorize via loadBoard (membership)
// and requireRole (owner-only actions).
router.get('/:boardId', loadBoard, getBoard);
router.patch('/:boardId', loadBoard, requireRole('owner'), updateBoard);
router.delete('/:boardId', loadBoard, requireRole('owner'), deleteBoard);

// Any member may add a list to the board.
router.post('/:boardId/lists', loadBoard, requireRole('member'), createList);

router.post('/:boardId/members', loadBoard, requireRole('owner'), addMember);
router.delete(
  '/:boardId/members/:userId',
  loadBoard,
  requireRole('owner'),
  removeMember
);

export default router;
