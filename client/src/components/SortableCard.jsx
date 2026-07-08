import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// A single draggable card — index-card styling with a colour stripe matching
// its list. Clicking (without dragging) opens the editor.
export default function SortableCard({ card, color, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card._id, data: { type: 'card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderLeft: `3px solid ${color}`,
  };

  const hasDesc = card.description && card.description.trim().length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      className="card-lift cursor-grab rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink shadow-sm hover:shadow-md active:cursor-grabbing"
    >
      <div className="font-medium leading-snug">{card.title}</div>
      {hasDesc && (
        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
          <span>≡</span>
          <span className="truncate">{card.description}</span>
        </div>
      )}
    </div>
  );
}
