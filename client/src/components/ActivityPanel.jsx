import { timeAgo } from '../utils/timeago.js';

// Initials chip for the actor, coloured deterministically from their name.
const CHIP_COLORS = ['#e4572e', '#2a9d8f', '#e0a100', '#5b6ee1', '#b5497f', '#3d9970'];
function chipColor(name = '') {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return CHIP_COLORS[sum % CHIP_COLORS.length];
}
function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Slide-in drawer showing the board's history feed.
export default function ActivityPanel({ open, activities, onClose }) {
  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-20 bg-ink/30 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-30 flex h-full w-80 flex-col border-l border-line bg-paper shadow-2xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">History</h2>
            <p className="text-xs text-muted">Everything that's happened here</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activities.length === 0 ? (
            <p className="px-1 pt-6 text-center text-sm text-muted">
              Nothing yet. Move a card or two and it'll show up here.
            </p>
          ) : (
            <ul className="space-y-1">
              {activities.map((a) => (
                <li
                  key={a._id}
                  className="flex gap-3 rounded-lg px-2 py-2 hover:bg-surface"
                >
                  <span
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: chipColor(a.actorName) }}
                  >
                    {initials(a.actorName)}
                  </span>
                  <div className="min-w-0 text-sm">
                    <span className="font-medium text-ink">{a.actorName}</span>{' '}
                    <span className="text-ink/80">{a.text}</span>
                    <div className="mt-0.5 text-xs text-muted">{timeAgo(a.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
