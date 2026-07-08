import { Card } from '../models/Card.js';
import { List } from '../models/List.js';
import { ApiError } from '../utils/ApiError.js';
import { appendPosition, between } from '../utils/position.js';

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
    const { title, description, list, position, before, after } = req.body || {};

    if (title !== undefined) {
      if (!String(title).trim()) throw new ApiError(400, 'title cannot be empty');
      req.card.title = String(title).trim();
    }
    if (description !== undefined) {
      req.card.description = String(description);
    }

    if (list !== undefined && String(list) !== String(req.card.list)) {
      const target = await List.findOne({ _id: list, board: req.board._id });
      if (!target) throw new ApiError(400, 'Target list is not on this board');
      req.card.list = target._id;
    }

    if (position !== undefined) {
      req.card.position = Number(position);
    } else if (before !== undefined || after !== undefined) {
      req.card.position = between(before ?? null, after ?? null);
    }

    req.card.version += 1;
    await req.card.save();
    res.json({ card: req.card });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cards/:cardId — remove a card.
export async function deleteCard(req, res, next) {
  try {
    await req.card.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
