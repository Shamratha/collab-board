# CollabBoard

A collaborative, real-time project board — a mini Linear/Trello. Multiple people work on the same board at once: create lists, add cards, drag cards between lists, and every change appears instantly for everyone viewing the board (no refresh), powered by Socket.io rather than polling.

**Stack:** MongoDB · Express · React · Node.js · Socket.io · JWT auth · role-based permissions.

## Why this project

- **Real-time reliability.** The interesting part isn't CRUD — it's keeping many clients consistent as they mutate shared state concurrently. Writes commit to the database first, then a change notification is broadcast to the board's room, so every client converges on server truth.
- **Classic full-stack, end-to-end.** JWT auth, MongoDB schema design, RBAC (board owner vs member), and a REST API — a complete traditional web app.

## Status

Built in phases; each phase is independently runnable and demoable.

- [x] **Phase 0** — monorepo scaffold, config, DB connection, `/health`
- [x] **Phase 1a** — auth: register / login / me (JWT), tests
- [x] **Phase 1b** — boards + membership + role-based permissions
- [x] **Phase 1c (API)** — lists + cards CRUD, float-position ordering, cascade deletes
- [ ] **Phase 1c (UI)** — React client + drag-and-drop board
- [ ] **Phase 2** — Socket.io live sync across clients
- [ ] **Phase 3 (stretch)** — optimistic UI + version-based conflict resolution

**Backend test coverage:** 42 tests across auth, boards/RBAC, and lists/cards (run `npm test`).

## Architecture

```
collab-board/               npm workspaces monorepo
├─ server/    Express + Mongoose + Socket.io + JWT
└─ client/    React (Vite) + Tailwind + @dnd-kit   (added in Phase 1c)
```

### Data model

- **User** — name, email (unique), passwordHash (bcrypt).
- **Board** — title, owner, `members: [{ user, role }]`.
- **List** — belongs to a board, `position` (float) for ordering.
- **Card** — belongs to a board + list, `position` (float), `version` (for conflict resolution in Phase 3).

Cards reference their board directly so a whole board loads in one indexed query, and the Socket.io room is simply `board:<id>`. Ordering uses a **float `position`**: moving a card sets its position to the midpoint of its new neighbors — an O(1) write with no sibling re-indexing.

### Auth & permissions

JWT (Bearer token). `requireAuth` verifies the token and loads the user. Board routes authorize against membership: **owner** can manage the board and its members; **member** can edit lists and cards only.

## Getting started

Requires Node ≥ 20 and a MongoDB connection string (MongoDB Atlas free tier, or local `mongod`).

```bash
git clone <repo> && cd collab-board
npm install
cp .env.example .env         # then fill in MONGO_URI and JWT_SECRET
npm run dev                  # starts the API on http://localhost:4000
```

Health check: `curl http://localhost:4000/health` → `{"status":"ok"}`.

### Tests

The server suite runs against an in-memory MongoDB (no real database needed):

```bash
npm test
```

## API (current)

| Method | Path                               | Auth        | Description                              |
|--------|------------------------------------|-------------|------------------------------------------|
| POST   | `/api/auth/register`               | —           | Create an account, returns a JWT         |
| POST   | `/api/auth/login`                  | —           | Log in, returns a JWT                    |
| GET    | `/api/auth/me`                     | JWT         | Current user                             |
| GET    | `/api/boards`                      | member      | Boards the caller belongs to             |
| POST   | `/api/boards`                      | JWT         | Create a board (creator = owner)         |
| GET    | `/api/boards/:id`                  | member      | Board hydrated with its lists + cards    |
| PATCH  | `/api/boards/:id`                  | **owner**   | Rename the board                         |
| DELETE | `/api/boards/:id`                  | **owner**   | Delete board (cascades lists + cards)    |
| POST   | `/api/boards/:id/members`          | **owner**   | Add a member by email                    |
| DELETE | `/api/boards/:id/members/:userId`  | **owner**   | Remove a member                          |
| POST   | `/api/boards/:id/lists`            | member      | Add a list                               |
| PATCH  | `/api/lists/:id`                   | member      | Rename / reorder a list                  |
| DELETE | `/api/lists/:id`                   | member      | Delete a list (cascades its cards)       |
| POST   | `/api/lists/:id/cards`             | member      | Add a card                               |
| PATCH  | `/api/cards/:id`                   | member      | Edit / move / reorder a card             |
| DELETE | `/api/cards/:id`                   | member      | Delete a card                            |
| GET    | `/health`                          | —           | Liveness check                           |

Reordering: `PATCH` a list/card with either an explicit `position` (float) or
`before`/`after` neighbor positions — the server places the item at their midpoint.
Moving a card across lists: include the target `list` id.

_Client UI and real-time sync land in the phases above._
