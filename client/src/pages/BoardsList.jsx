import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Your boards</h1>

      <form onSubmit={createBoard} className="mb-8 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New board title…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <button className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          Create
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : boards.length === 0 ? (
        <p className="text-slate-500">No boards yet — create your first one above.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <li key={b._id}>
              <Link
                to={`/boards/${b._id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow"
              >
                <div className="font-medium text-slate-800">{b.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {b.members.length} member{b.members.length === 1 ? '' : 's'}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
