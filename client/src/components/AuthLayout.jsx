import { Link } from 'react-router-dom';

// A little faux-board illustration so the sign-in screen shows what the app is,
// instead of a lone centered form.
function MiniBoard() {
  const cols = [
    { c: '#e4572e', items: ['Draft the brief', 'Sync with design'] },
    { c: '#2a9d8f', items: ['Ship auth', 'Wire sockets'] },
    { c: '#e0a100', items: ['Launch day'] },
  ];
  return (
    <div className="flex gap-3">
      {cols.map((col, i) => (
        <div key={i} className="w-28 rounded-lg bg-white/10 p-2">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: col.c }} />
            <span className="h-2 w-12 rounded-full bg-white/25" />
          </div>
          <div className="space-y-2">
            {col.items.map((t, j) => (
              <div
                key={j}
                className="rounded-md bg-white/90 px-2 py-1.5 text-[11px] font-medium text-ink shadow-sm"
                style={{ borderLeft: `3px solid ${col.c}` }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuthLayout({ title, subtitle, error, children, footer }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-paper md:flex lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 rotate-3 place-items-center rounded-md bg-accent font-display text-base font-bold text-white">
            C
          </span>
          <span className="font-display text-xl font-bold">CollabBoard</span>
        </Link>

        <div className="max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Where the whole team moves the same{' '}
            <span className="text-accent">card</span> at once.
          </h2>
          <p className="mt-4 text-paper/60">
            Lists, cards, drag-and-drop — and everyone sees every change the
            instant it happens. No refresh, no “who has the latest?”.
          </p>
          <div className="mt-8">
            <MiniBoard />
          </div>
        </div>

        <p className="text-sm text-paper/40">Real-time boards for small teams.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}

          {error && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent-ink">
              {error}
            </div>
          )}

          <div className="mt-6">{children}</div>
          <p className="mt-6 text-sm text-muted">{footer}</p>
        </div>
      </div>
    </div>
  );
}
