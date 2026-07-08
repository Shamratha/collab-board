import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link to="/" className="text-lg font-semibold text-indigo-600">
        CollabBoard
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-500">{user?.name}</span>
        <button
          onClick={logout}
          className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
