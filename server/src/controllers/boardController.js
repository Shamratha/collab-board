import { Board } from '../models/Board.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/boards — boards the caller is a member of.
export async function listBoards(req, res, next) {
  try {
    const boards = await Board.find({ 'members.user': req.user._id })
      .sort({ updatedAt: -1 })
      .populate('members.user', 'name email');
    res.json({ boards });
  } catch (err) {
    next(err);
  }
}

// POST /api/boards — create a board; creator becomes its owner.
export async function createBoard(req, res, next) {
  try {
    const { title } = req.body || {};
    if (!title || !String(title).trim()) {
      throw new ApiError(400, 'title is required');
    }

    const board = await Board.create({
      title: String(title).trim(),
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    await board.populate('members.user', 'name email');
    res.status(201).json({ board });
  } catch (err) {
    next(err);
  }
}

// GET /api/boards/:boardId — a single board (loadBoard already authorized it).
export async function getBoard(req, res, next) {
  try {
    await req.board.populate('members.user', 'name email');
    res.json({ board: req.board });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/boards/:boardId — rename (owner only).
export async function updateBoard(req, res, next) {
  try {
    const { title } = req.body || {};
    if (title !== undefined) {
      if (!String(title).trim()) throw new ApiError(400, 'title cannot be empty');
      req.board.title = String(title).trim();
    }
    await req.board.save();
    await req.board.populate('members.user', 'name email');
    res.json({ board: req.board });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/boards/:boardId — remove the board (owner only).
export async function deleteBoard(req, res, next) {
  try {
    await req.board.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// POST /api/boards/:boardId/members — add a member by email (owner only).
export async function addMember(req, res, next) {
  try {
    const { email, role = 'member' } = req.body || {};
    if (!email) throw new ApiError(400, 'email is required');
    if (!['owner', 'member'].includes(role)) {
      throw new ApiError(400, 'role must be "owner" or "member"');
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) throw new ApiError(404, 'No user with that email');

    if (req.board.membershipOf(user._id)) {
      throw new ApiError(409, 'User is already a member');
    }

    req.board.members.push({ user: user._id, role });
    await req.board.save();
    await req.board.populate('members.user', 'name email');
    res.status(201).json({ board: req.board });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/boards/:boardId/members/:userId — remove a member (owner only).
export async function removeMember(req, res, next) {
  try {
    const { userId } = req.params;

    if (String(userId) === String(req.board.owner)) {
      throw new ApiError(400, 'Cannot remove the board owner');
    }
    if (!req.board.membershipOf(userId)) {
      throw new ApiError(404, 'User is not a member of this board');
    }

    req.board.members = req.board.members.filter(
      (m) => String(m.user) !== String(userId)
    );
    await req.board.save();
    await req.board.populate('members.user', 'name email');
    res.json({ board: req.board });
  } catch (err) {
    next(err);
  }
}
