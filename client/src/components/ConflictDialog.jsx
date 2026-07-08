// Shown when a card edit is rejected because someone else changed the card
// first (HTTP 409). Lets the user compare and choose whose version wins.
export default function ConflictDialog({ attempted, server, onOverwrite, onDiscard }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-semibold text-slate-800">
          This card changed while you were editing
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Someone else saved a new version. Choose which one to keep.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mb-1 text-xs font-medium uppercase text-slate-400">
              Their version
            </div>
            <div className="font-medium text-slate-800">{server.title}</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
              {server.description || <span className="text-slate-400">No description</span>}
            </div>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
            <div className="mb-1 text-xs font-medium uppercase text-indigo-400">
              Your edit
            </div>
            <div className="font-medium text-slate-800">{attempted.title}</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
              {attempted.description || <span className="text-slate-400">No description</span>}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onDiscard}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Keep theirs
          </button>
          <button
            onClick={onOverwrite}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Overwrite with mine
          </button>
        </div>
      </div>
    </div>
  );
}
