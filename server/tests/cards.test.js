import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function makeUser(email, name = 'User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'secret123' });
  const { token, user } = res.body;
  return { token, user, auth: (req) => req.set('Authorization', `Bearer ${token}`) };
}

let owner;
let outsider;
let board;

beforeEach(async () => {
  owner = await makeUser('owner@example.com', 'Owner');
  outsider = await makeUser('outsider@example.com', 'Outsider');
  const res = await owner.auth(request(app).post('/api/boards')).send({ title: 'Board' });
  board = res.body.board;
});

async function addList(title = 'To Do') {
  const res = await owner
    .auth(request(app).post(`/api/boards/${board._id}/lists`))
    .send({ title });
  return res.body.list;
}

async function addCard(listId, title = 'Task') {
  const res = await owner
    .auth(request(app).post(`/api/lists/${listId}/cards`))
    .send({ title });
  return res.body.card;
}

describe('lists', () => {
  it('creates lists with increasing positions', async () => {
    const a = await addList('A');
    const b = await addList('B');
    expect(a.position).toBeLessThan(b.position);
    expect(a.board).toBe(board._id);
  });

  it('non-member cannot create a list (403)', async () => {
    const res = await outsider
      .auth(request(app).post(`/api/boards/${board._id}/lists`))
      .send({ title: 'X' });
    expect(res.status).toBe(403);
  });

  it('renames a list', async () => {
    const list = await addList('Old');
    const res = await owner
      .auth(request(app).patch(`/api/lists/${list._id}`))
      .send({ title: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.list.title).toBe('New');
  });

  it('deleting a list cascades its cards', async () => {
    const list = await addList();
    await addCard(list._id, 'c1');
    await addCard(list._id, 'c2');
    await owner.auth(request(app).delete(`/api/lists/${list._id}`)).expect(204);
    const board2 = await owner.auth(request(app).get(`/api/boards/${board._id}`));
    expect(board2.body.cards).toHaveLength(0);
    expect(board2.body.lists).toHaveLength(0);
  });
});

describe('cards', () => {
  it('creates a card at the end of a list', async () => {
    const list = await addList();
    const c1 = await addCard(list._id, 'first');
    const c2 = await addCard(list._id, 'second');
    expect(c1.position).toBeLessThan(c2.position);
    expect(c1.list).toBe(list._id);
    expect(c1.version).toBe(0);
  });

  it('edits a card title and bumps version', async () => {
    const list = await addList();
    const card = await addCard(list._id, 'draft');
    const res = await owner
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ title: 'final', description: 'details' });
    expect(res.status).toBe(200);
    expect(res.body.card.title).toBe('final');
    expect(res.body.card.description).toBe('details');
    expect(res.body.card.version).toBe(1);
  });

  it('moves a card to another list via midpoint positioning', async () => {
    const todo = await addList('To Do');
    const doing = await addList('Doing');
    const a = await addCard(doing._id, 'a'); // establishes positions in target
    const b = await addCard(doing._id, 'b');
    const card = await addCard(todo._id, 'mover');

    // Move `card` into `doing`, between a and b.
    const res = await owner
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ list: doing._id, before: a.position, after: b.position });

    expect(res.status).toBe(200);
    expect(res.body.card.list).toBe(doing._id);
    expect(res.body.card.position).toBeGreaterThan(a.position);
    expect(res.body.card.position).toBeLessThan(b.position);
  });

  it('rejects moving a card to a list on another board (400)', async () => {
    const list = await addList();
    const card = await addCard(list._id);
    // A list on a different board owned by outsider.
    const otherBoard = (
      await outsider.auth(request(app).post('/api/boards')).send({ title: 'Other' })
    ).body.board;
    const otherList = (
      await outsider
        .auth(request(app).post(`/api/boards/${otherBoard._id}/lists`))
        .send({ title: 'L' })
    ).body.list;

    const res = await owner
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ list: otherList._id });
    expect(res.status).toBe(400);
  });

  it('non-member cannot edit a card (403)', async () => {
    const list = await addList();
    const card = await addCard(list._id);
    const res = await outsider
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ title: 'hacked' });
    expect(res.status).toBe(403);
  });

  it('accepts an edit whose version matches the current card', async () => {
    const list = await addList();
    const card = await addCard(list._id, 'v0'); // version 0
    const res = await owner
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ title: 'v1', version: 0 });
    expect(res.status).toBe(200);
    expect(res.body.card.version).toBe(1);
  });

  it('rejects a stale-version edit with 409 and returns the current card', async () => {
    const list = await addList();
    const card = await addCard(list._id, 'v0'); // version 0
    // First edit succeeds and bumps the version to 1.
    await owner
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ title: 'v1', version: 0 })
      .expect(200);
    // A second edit still claiming version 0 is stale → 409 + current card.
    const res = await owner
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ title: 'v2', version: 0 });
    expect(res.status).toBe(409);
    expect(res.body.card.title).toBe('v1');
    expect(res.body.card.version).toBe(1);
  });

  it('allows edits with no version (last-writer-wins moves)', async () => {
    const list = await addList();
    const card = await addCard(list._id, 'v0');
    const res = await owner
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ title: 'moved' }); // no version → no conflict check
    expect(res.status).toBe(200);
  });

  it('deletes a card', async () => {
    const list = await addList();
    const card = await addCard(list._id);
    await owner.auth(request(app).delete(`/api/cards/${card._id}`)).expect(204);
    const board2 = await owner.auth(request(app).get(`/api/boards/${board._id}`));
    expect(board2.body.cards).toHaveLength(0);
  });

  it('deleting a board cascades lists and cards', async () => {
    const list = await addList();
    await addCard(list._id);
    await owner.auth(request(app).delete(`/api/boards/${board._id}`)).expect(204);
    // Board gone → 404 on read.
    await owner.auth(request(app).get(`/api/boards/${board._id}`)).expect(404);
  });
});

describe('activity history', () => {
  it('records a human-readable entry when a card is created', async () => {
    const list = await addList('To Do');
    await addCard(list._id, 'Wire up auth');
    const res = await owner.auth(request(app).get(`/api/boards/${board._id}/activity`));
    expect(res.status).toBe(200);
    const created = res.body.activities.find((a) => a.type === 'card.created');
    expect(created).toBeTruthy();
    expect(created.actorName).toBe('Owner');
    expect(created.text).toContain('Wire up auth');
  });

  it('records a move with the destination list', async () => {
    const todo = await addList('To Do');
    const done = await addList('Done');
    const card = await addCard(todo._id, 'Ship it');
    await owner
      .auth(request(app).patch(`/api/cards/${card._id}`))
      .send({ list: done._id });
    const res = await owner.auth(request(app).get(`/api/boards/${board._id}/activity`));
    const moved = res.body.activities.find((a) => a.type === 'card.moved');
    expect(moved.text).toContain('Done');
  });

  it('is newest-first and scoped to the board', async () => {
    const list = await addList('To Do');
    await addCard(list._id, 'first');
    await addCard(list._id, 'second');
    const res = await owner.auth(request(app).get(`/api/boards/${board._id}/activity`));
    // Most recent entry is at the front.
    expect(res.body.activities[0].text).toContain('second');
  });

  it('denies activity access to non-members (403)', async () => {
    const res = await outsider.auth(request(app).get(`/api/boards/${board._id}/activity`));
    expect(res.status).toBe(403);
  });

  it('paginates with a cursor and returns non-overlapping pages', async () => {
    const list = await addList('To Do');
    for (let i = 0; i < 5; i++) await addCard(list._id, `c${i}`);

    const first = await owner.auth(
      request(app).get(`/api/boards/${board._id}/activity?limit=3`)
    );
    expect(first.body.activities).toHaveLength(3);
    expect(first.body.nextCursor).toBeTruthy();

    const next = await owner.auth(
      request(app).get(
        `/api/boards/${board._id}/activity?limit=3&cursor=${first.body.nextCursor}`
      )
    );
    const firstIds = first.body.activities.map((a) => a._id);
    const nextIds = next.body.activities.map((a) => a._id);
    expect(nextIds.some((id) => firstIds.includes(id))).toBe(false);
  });
});

describe('board hydration', () => {
  it('returns lists and cards ordered by position', async () => {
    const todo = await addList('To Do');
    const done = await addList('Done');
    await addCard(todo._id, 't1');
    await addCard(todo._id, 't2');
    await addCard(done._id, 'd1');

    const res = await owner.auth(request(app).get(`/api/boards/${board._id}`));
    expect(res.status).toBe(200);
    expect(res.body.lists).toHaveLength(2);
    expect(res.body.cards).toHaveLength(3);
    // positions sorted ascending
    const positions = res.body.cards.map((c) => c.position);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
