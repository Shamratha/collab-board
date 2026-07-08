// Shown when a card edit is rejected because someone else changed the card
// first (HTTP 409). Lets the user compare and choose whose version wins.
export default function ConflictDialog({ attempted, server, onOverwrite, onDiscard }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <h2 className="font-display text-lg font-bold text-ink">
            This card changed while you were editing
          </h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          Someone else saved a new version. Choose which one to keep.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-paper/40 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Their version
            </div>
            <div className="font-medium text-ink">{server.title}</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-muted">
              {server.description || <span className="text-muted/60">No description</span>}
            </div>
          </div>
          <div className="rounded-xl border-2 border-accent/40 bg-accent/5 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-ink">
              Your edit
            </div>
            <div className="font-medium text-ink">{attempted.title}</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-muted">
              {attempted.description || <span className="text-muted/60">No description</span>}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onDiscard}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:bg-ink/5"
          >
            Keep theirs
          </button>
          <button
            onClick={onOverwrite}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-ink"
          >
            Overwrite with mine
          </button>
        </div>
      </div>
    </div>
  );
}
