import mongoose from 'mongoose';
import { Board } from '../models/Board.js';
import { User } from '../models/User.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from '../utils/activity.js';

// GET /api/boards?limit&offset — boards the caller is a member of (paginated).
export async function listBoards(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const filter = { 'members.user': req.user._id };

    const [boards, total] = await Promise.all([
      Board.find(filter)
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('members.user', 'name email'),
      Board.countDocuments(filter),
    ]);

    const nextOffset = offset + boards.length < total ? offset + boards.length : null;
    res.json({ boards, total, limit, offset, nextOffset });
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

// GET /api/boards/:boardId — a board hydrated with its lists and cards, each
// ordered by position so the client can render columns directly.
export async function getBoard(req, res, next) {
  try {
    await req.board.populate('members.user', 'name email');
    const [lists, cards] = await Promise.all([
      List.find({ board: req.board._id }).sort({ position: 1 }),
      Card.find({ board: req.board._id }).sort({ position: 1 }),
    ]);
    res.json({ board: req.board, lists, cards });
  } catch (err) {
    next(err);
  }
}

// GET /api/boards/:boardId/activity?cursor&limit — activity feed, newest first,
// cursor-paginated. The cursor is the _id of the last item seen; because
// ObjectIds are time-ordered, `_id < cursor` cleanly yields the next older page.
export async function getActivity(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const query = { board: req.board._id };

    const { cursor } = req.query;
    if (cursor && mongoose.isValidObjectId(cursor)) {
      query._id = { $lt: cursor };
    }

    // Fetch one extra to know whether another page exists.
    const rows = await Activity.find(query).sort({ _id: -1 }).limit(limit + 1);
    const hasMore = rows.length > limit;
    const activities = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? activities[activities.length - 1]._id : null;

    res.json({ activities, nextCursor });
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

// DELETE /api/boards/:boardId — remove the board and cascade its lists, cards,
// and activity. Wrapped in a transaction so it's all-or-nothing; falls back to
// sequential deletes on single-node deployments that don't support transactions.
export async function deleteBoard(req, res, next) {
  const boardId = req.board._id;
  const wipe = (opts = {}) =>
    Promise.all([
      Card.deleteMany({ board: boardId }, opts),
      List.deleteMany({ board: boardId }, opts),
      Activity.deleteMany({ board: boardId }, opts),
      Board.deleteOne({ _id: boardId }, opts),
    ]);

  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => wipe({ session }));
    } finally {
      await session.endSession();
    }
    return res.status(204).end();
  } catch (err) {
    // Transactions require a replica set (Atlas has one; a single local mongod
    // does not). Fall back to sequential deletes there.
    if (isTransactionUnsupported(err)) {
      await wipe();
      return res.status(204).end();
    }
    next(err);
  }
}

function isTransactionUnsupported(err) {
  const msg = String(err?.message || '');
  return (
    err?.code === 20 || // IllegalOperation
    err?.codeName === 'IllegalOperation' ||
    /Transaction numbers are only allowed on a replica set/i.test(msg) ||
    /Transactions are not supported/i.test(msg) ||
    /replica set/i.test(msg)
  );
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
    await logActivity(req, req.board._id, 'member.added', `added ${user.name} to the board`);
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
