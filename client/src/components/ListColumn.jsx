import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './SortableCard.jsx';

// One board column: a colour-tabbed, droppable region wrapping a sortable list
// of cards, plus an "add card" input and a delete button.
export default function ListColumn({
  list,
  cards,
  color,
  onAddCard,
  onDeleteList,
  onOpenCard,
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: list._id,
    data: { type: 'list', list },
  });

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onAddCard(list._id, title.trim());
    setTitle('');
    setAdding(false);
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-line bg-surface/70 shadow-sm">
      {/* Colour tab header */}
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2.5"
        style={{ background: `${color}14`, borderBottom: `2px solid ${color}` }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          <h3 className="font-display font-semibold text-ink">{list.title}</h3>
          <span className="rounded-full bg-ink/5 px-1.5 text-xs text-muted">
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => onDeleteList(list._id)}
          title="Delete list"
          className="text-muted transition hover:text-accent-ink"
        >
          ✕
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[12px] flex-col gap-2 p-2.5 transition-colors ${
          isOver ? 'bg-ink/[0.03]' : ''
        }`}
      >
        <SortableContext
          items={cards.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard key={card._id} card={card} color={color} onOpen={onOpenCard} />
          ))}
        </SortableContext>

        {adding ? (
          <form onSubmit={submit}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => !title && setAdding(false)}
              placeholder="What needs doing?"
              className="w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg px-2.5 py-2 text-left text-sm font-medium text-muted transition hover:bg-ink/5 hover:text-ink"
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}
