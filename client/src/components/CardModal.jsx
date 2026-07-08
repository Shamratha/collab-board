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
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-lg border border-line bg-paper/40 px-3 py-2 font-display text-lg font-semibold outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Add a bit more detail…"
          className="mb-4 w-full resize-none rounded-lg border border-line bg-paper/40 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={() => onDelete(card._id)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent-ink hover:bg-accent/10"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
