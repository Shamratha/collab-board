import { useState } from 'react';

// Simple editor for a card's title/description, with delete.
export default function CardModal({ card, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      // Send the version we loaded so the server can detect a concurrent edit.
      await onSave(card._id, {
        title: title.trim(),
        description,
        version: card.version,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 font-medium"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Add a description…"
          className="mb-4 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={() => onDelete(card._id)}
            className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
