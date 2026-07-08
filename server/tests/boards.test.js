import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

// Register a user and return { token, user, auth } where auth() sets the header.
async function makeUser(email, name = 'User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'secret123' });
  const { token, user } = res.body;
  return {
    token,
    user,
    auth: (req) => req.set('Authorization', `Bearer ${token}`),
  };
}

let owner;
let member;
let outsider;

beforeEach(async () => {
  owner = await makeUser('owner@example.com', 'Owner');
  member = await makeUser('member@example.com', 'Member');
  outsider = await makeUser('outsider@example.com', 'Outsider');
});

async function createBoard(user, title = 'My Board') {
  const res = await user.auth(request(app).post('/api/boards')).send({ title });
  return res.body.board;
}

describe('POST /api/boards', () => {
  it('creates a board with the creator as owner', async () => {
    const res = await owner.auth(request(app).post('/api/boards')).send({ title: 'Roadmap' });
    expect(res.status).toBe(201);
    expect(res.body.board.title).toBe('Roadmap');
    expect(res.body.board.members).toHaveLength(1);
    expect(res.body.board.members[0].role).toBe('owner');
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/boards').send({ title: 'x' });
    expect(res.status).toBe(401);
  });

  it('rejects an empty title with 400', async () => {
    const res = await owner.auth(request(app).post('/api/boards')).send({ title: '  ' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/boards', () => {
  it('lists only boards the user belongs to', async () => {
    await createBoard(owner, 'A');
    await createBoard(outsider, 'B');
    const res = await owner.auth(request(app).get('/api/boards'));
    expect(res.status).toBe(200);
    expect(res.body.boards).toHaveLength(1);
    expect(res.body.boards[0].title).toBe('A');
  });

  it('paginates with limit/offset', async () => {
    for (let i = 0; i < 3; i++) await createBoard(owner, `B${i}`);
    const p1 = await owner.auth(request(app).get('/api/boards?limit=2&offset=0'));
    expect(p1.body.boards).toHaveLength(2);
    expect(p1.body.total).toBe(3);
    expect(p1.body.nextOffset).toBe(2);
    const p2 = await owner.auth(request(app).get('/api/boards?limit=2&offset=2'));
    expect(p2.body.boards).toHaveLength(1);
    expect(p2.body.nextOffset).toBeNull();
  });
});

describe('GET /api/boards/:id', () => {
  it('lets a member read the board', async () => {
    const board = await createBoard(owner);
    const res = await owner.auth(request(app).get(`/api/boards/${board._id}`));
    expect(res.status).toBe(200);
    expect(res.body.board._id).toBe(board._id);
  });

  it('returns 403 for a non-member', async () => {
    const board = await createBoard(owner);
    const res = await outsider.auth(request(app).get(`/api/boards/${board._id}`));
    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent board id', async () => {
    const res = await owner.auth(request(app).get('/api/boards/64b7f0000000000000000000'));
    expect(res.status).toBe(404);
  });

  it('returns 404 for a malformed id', async () => {
    const res = await owner.auth(request(app).get('/api/boards/not-an-id'));
    expect(res.status).toBe(404);
  });
});

describe('member management', () => {
  it('owner adds a member by email', async () => {
    const board = await createBoard(owner);
    const res = await owner
      .auth(request(app).post(`/api/boards/${board._id}/members`))
      .send({ email: 'member@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.board.members).toHaveLength(2);
  });

  it('added member can then read the board', async () => {
    const board = await createBoard(owner);
    await owner
      .auth(request(app).post(`/api/boards/${board._id}/members`))
      .send({ email: 'member@example.com' });
    const res = await member.auth(request(app).get(`/api/boards/${board._id}`));
    expect(res.status).toBe(200);
  });

  it('rejects adding an unknown email with 404', async () => {
    const board = await createBoard(owner);
    const res = await owner
      .auth(request(app).post(`/api/boards/${board._id}/members`))
      .send({ email: 'ghost@example.com' });
    expect(res.status).toBe(404);
  });

  it('rejects adding a duplicate member with 409', async () => {
    const board = await createBoard(owner);
    const add = () =>
      owner
        .auth(request(app).post(`/api/boards/${board._id}/members`))
        .send({ email: 'member@example.com' });
    await add();
    const res = await add();
    expect(res.status).toBe(409);
  });

  it('a plain member cannot add other members (403)', async () => {
    const board = await createBoard(owner);
    await owner
      .auth(request(app).post(`/api/boards/${board._id}/members`))
      .send({ email: 'member@example.com' });
    const res = await member
      .auth(request(app).post(`/api/boards/${board._id}/members`))
      .send({ email: 'outsider@example.com' });
    expect(res.status).toBe(403);
  });

  it('owner removes a member', async () => {
    const board = await createBoard(owner);
    await owner
      .auth(request(app).post(`/api/boards/${board._id}/members`))
      .send({ email: 'member@example.com' });
    const res = await owner.auth(
      request(app).delete(`/api/boards/${board._id}/members/${member.user._id}`)
    );
    expect(res.status).toBe(200);
    expect(res.body.board.members).toHaveLength(1);
  });

  it('cannot remove the board owner', async () => {
    const board = await createBoard(owner);
    const res = await owner.auth(
      request(app).delete(`/api/boards/${board._id}/members/${owner.user._id}`)
    );
    expect(res.status).toBe(400);
  });
});

describe('board updates and deletion', () => {
  it('owner renames the board', async () => {
    const board = await createBoard(owner, 'Old');
    const res = await owner
      .auth(request(app).patch(`/api/boards/${board._id}`))
      .send({ title: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.board.title).toBe('New');
  });

  it('a plain member cannot rename the board (403)', async () => {
    const board = await createBoard(owner);
    await owner
      .auth(request(app).post(`/api/boards/${board._id}/members`))
      .send({ email: 'member@example.com' });
    const res = await member
      .auth(request(app).patch(`/api/boards/${board._id}`))
      .send({ title: 'Hijacked' });
    expect(res.status).toBe(403);
  });

  it('owner deletes the board', async () => {
    const board = await createBoard(owner);
    const del = await owner.auth(request(app).delete(`/api/boards/${board._id}`));
    expect(del.status).toBe(204);
    const get = await owner.auth(request(app).get(`/api/boards/${board._id}`));
    expect(get.status).toBe(404);
  });

  it('a plain member cannot delete the board (403)', async () => {
    const board = await createBoard(owner);
    await owner
      .auth(request(app).post(`/api/boards/${board._id}/members`))
      .send({ email: 'member@example.com' });
    const res = await member.auth(request(app).delete(`/api/boards/${board._id}`));
    expect(res.status).toBe(403);
  });
});
