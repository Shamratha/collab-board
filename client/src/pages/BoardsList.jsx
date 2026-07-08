import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { listColor } from '../theme.js';

export default function BoardsList() {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/boards')
      .then(({ data }) => setBoards(data.boards))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createBoard(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data } = await api.post('/boards', { title: title.trim() });
      setBoards((prev) => [data.board, ...prev]);
      setTitle('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">
          Your <span className="ink-mark">boards</span>
        </h1>
        <p className="mt-1 text-muted">Everything your team is working on, in one place.</p>
      </div>

      <form onSubmit={createBoard} className="mb-10 flex max-w-lg gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name a new board — “Q3 Launch”, “Bug triage”…"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-accent-ink">
          Create
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-accent-ink">{error}</p>}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : boards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-8 py-14 text-center">
          <svg
            width="52"
            height="40"
            viewBox="0 0 52 40"
            className="mx-auto mb-3 text-muted/50"
            fill="none"
          >
            <rect x="1" y="6" width="14" height="33" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="19" y="6" width="14" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="37" y="6" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M4 2h46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 5" />
          </svg>
          <p className="font-display text-xl font-semibold text-ink">No boards yet</p>
          <p className="mt-1 text-muted">
            Every big thing starts as an empty first column. Name one above.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b, i) => {
            const color = listColor(i);
            return (
              <li key={b._id}>
                <Link
                  to={`/boards/${b._id}`}
                  className="card-lift block overflow-hidden rounded-xl border border-line bg-surface shadow-sm"
                >
                  <div className="h-1.5" style={{ background: color }} />
                  <div className="p-5">
                    <div className="font-display text-lg font-semibold text-ink">
                      {b.title}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                      <span
                        className="inline-grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: color }}
                      >
                        {b.members.length}
                      </span>
                      {b.members.length === 1 ? 'just you' : `${b.members.length} members`}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
        CollabBoard — a small real-time board, built by Shamratha.
      </footer>
    </div>
  );
}
