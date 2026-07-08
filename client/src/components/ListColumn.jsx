import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './SortableCard.jsx';

// One board column: a droppable region wrapping a sortable list of cards,
// plus an "add card" input and a delete button.
export default function ListColumn({ list, cards, onAddCard, onDeleteList, onOpenCard }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  // Droppable keyed by list id so cards can be dropped onto an empty column.
  const { setNodeRef } = useDroppable({ id: list._id, data: { type: 'list', list } });

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onAddCard(list._id, title.trim());
    setTitle('');
    setAdding(false);
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-200/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-slate-700">{list.title}</h3>
        <button
          onClick={() => onDeleteList(list._id)}
          title="Delete list"
          className="text-slate-400 hover:text-red-600"
        >
          ✕
        </button>
      </div>

      <div ref={setNodeRef} className="flex min-h-[8px] flex-col gap-2">
        <SortableContext
          items={cards.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard key={card._id} card={card} onOpen={onOpenCard} />
          ))}
        </SortableContext>
      </div>

      {adding ? (
        <form onSubmit={submit} className="mt-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title && setAdding(false)}
            placeholder="Card title…"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 rounded-md px-2 py-1 text-left text-sm text-slate-500 hover:bg-slate-300/50"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}
