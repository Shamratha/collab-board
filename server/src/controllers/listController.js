import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { ApiError } from '../utils/ApiError.js';
import { appendPosition, between } from '../utils/position.js';
import { emitToBoard } from '../utils/emit.js';
import { logActivity } from '../utils/activity.js';

// POST /api/boards/:boardId/lists — create a list, appended to the end.
export async function createList(req, res, next) {
  try {
    const { title } = req.body || {};
    if (!title || !String(title).trim()) throw new ApiError(400, 'title is required');

    const last = await List.findOne({ board: req.board._id }).sort({ position: -1 });
    const list = await List.create({
      board: req.board._id,
      title: String(title).trim(),
      position: appendPosition(last?.position),
    });

    emitToBoard(req, req.board._id, 'list:created', { list });
    await logActivity(req, req.board._id, 'list.created', `added list “${list.title}”`);
    res.status(201).json({ list });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/lists/:listId — rename and/or reorder.
// Reorder by passing `position` (a float) or `{ before, after }` neighbor positions.
export async function updateList(req, res, next) {
  try {
    const { title, position, before, after } = req.body || {};

    if (title !== undefined) {
      if (!String(title).trim()) throw new ApiError(400, 'title cannot be empty');
      req.list.title = String(title).trim();
    }

    if (position !== undefined) {
      req.list.position = Number(position);
    } else if (before !== undefined || after !== undefined) {
      req.list.position = between(before ?? null, after ?? null);
    }

    await req.list.save();
    emitToBoard(req, req.board._id, 'list:updated', { list: req.list });
    res.json({ list: req.list });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/lists/:listId — remove the list and cascade its cards.
export async function deleteList(req, res, next) {
  try {
    const listId = String(req.list._id);
    const listTitle = req.list.title;
    await Card.deleteMany({ list: req.list._id });
    await req.list.deleteOne();
    emitToBoard(req, req.board._id, 'list:deleted', { listId });
    await logActivity(req, req.board._id, 'list.deleted', `deleted list “${listTitle}”`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
