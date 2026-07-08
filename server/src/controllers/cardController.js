import { Card } from '../models/Card.js';
import { List } from '../models/List.js';
import { ApiError } from '../utils/ApiError.js';
import { appendPosition, between } from '../utils/position.js';
import { emitToBoard } from '../utils/emit.js';
import { logActivity } from '../utils/activity.js';

// POST /api/lists/:listId/cards — create a card at the end of the list.
export async function createCard(req, res, next) {
  try {
    const { title, description } = req.body || {};
    if (!title || !String(title).trim()) throw new ApiError(400, 'title is required');

    const last = await Card.findOne({ list: req.list._id }).sort({ position: -1 });
    const card = await Card.create({
      board: req.board._id,
      list: req.list._id,
      title: String(title).trim(),
      description: description ? String(description) : '',
      position: appendPosition(last?.position),
      createdBy: req.user._id,
    });

    emitToBoard(req, req.board._id, 'card:created', { card });
    await logActivity(
      req,
      req.board._id,
      'card.created',
      `added “${card.title}” to ${req.list.title}`
    );
    res.status(201).json({ card });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/cards/:cardId — edit fields and/or move between lists / reorder.
// Move: pass `list` (target list id) and a target position (`position` or
// `before`/`after`). Every successful edit bumps `version`.
export async function updateCard(req, res, next) {
  try {
    const { title, description, list, position, before, after, version } =
      req.body || {};

    // Optimistic concurrency control: if the client sends the version it last
    // saw and the card has since moved on, reject with 409 + the current card
    // so the client can show a conflict/merge prompt instead of clobbering.
    if (version !== undefined && Number(version) !== req.card.version) {
      return res.status(409).json({
        error: 'This card was changed by someone else',
        card: req.card,
      });
    }

    const contentEdited =
      (title !== undefined && String(title).trim() !== req.card.title) ||
      (description !== undefined && String(description) !== req.card.description);

    if (title !== undefined) {
      if (!String(title).trim()) throw new ApiError(400, 'title cannot be empty');
      req.card.title = String(title).trim();
    }
    if (description !== undefined) {
      req.card.description = String(description);
    }

    let movedToTitle = null;
    if (list !== undefined && String(list) !== String(req.card.list)) {
      const target = await List.findOne({ _id: list, board: req.board._id });
      if (!target) throw new ApiError(400, 'Target list is not on this board');
      req.card.list = target._id;
      movedToTitle = target.title;
    }

    if (position !== undefined) {
      req.card.position = Number(position);
    } else if (before !== undefined || after !== undefined) {
      req.card.position = between(before ?? null, after ?? null);
    }

    req.card.version += 1;
    await req.card.save();
    emitToBoard(req, req.board._id, 'card:updated', { card: req.card });

    // Log the meaningful change (a move reads better than "edited").
    if (movedToTitle) {
      await logActivity(req, req.board._id, 'card.moved', `moved “${req.card.title}” to ${movedToTitle}`);
    } else if (contentEdited) {
      await logActivity(req, req.board._id, 'card.edited', `edited “${req.card.title}”`);
    }

    res.json({ card: req.card });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cards/:cardId — remove a card.
export async function deleteCard(req, res, next) {
  try {
    const cardId = String(req.card._id);
    const listId = String(req.card.list);
    const cardTitle = req.card.title;
    await req.card.deleteOne();
    emitToBoard(req, req.board._id, 'card:deleted', { cardId, listId });
    await logActivity(req, req.board._id, 'card.deleted', `deleted “${cardTitle}”`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
