import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Initials avatar so the header feels a little more personal.
function Avatar({ name = '' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">
      {initials || '?'}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 rotate-3 place-items-center rounded-md bg-accent font-display text-sm font-bold text-white shadow-sm">
            C
          </span>
          <span className="font-display text-lg font-bold text-ink">CollabBoard</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">{user?.name}</span>
          <Avatar name={user?.name} />
          <button
            onClick={logout}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium text-ink transition hover:border-ink/30 hover:shadow-sm"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
