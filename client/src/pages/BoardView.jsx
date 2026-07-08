import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { api } from '../api/client.js';
import { getSocket } from '../socket.js';
import { positionBetween } from '../utils/position.js';
import ListColumn from '../components/ListColumn.jsx';
import CardModal from '../components/CardModal.jsx';

// Group a flat, position-sorted card array into { listId: [cards] }, ensuring
// every list (even empty ones) has an entry.
function groupCards(lists, cards) {
  const byList = {};
  lists.forEach((l) => {
    byList[l._id] = [];
  });
  cards.forEach((c) => {
    (byList[c.list] ||= []).push(c);
  });
  return byList;
}

export default function BoardView() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({});
  const [activeCard, setActiveCard] = useState(null);
  const [openCard, setOpenCard] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    // A small drag threshold so a plain click still opens the card editor.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    setLoading(true);
    api
      .get(`/boards/${id}`)
      .then(({ data }) => {
        setBoard(data.board);
        setLists(data.lists);
        setCardsByList(groupCards(data.lists, data.cards));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Real-time sync: join this board's room and apply changes from other users.
  // Handlers are idempotent (keyed by id), so the originator's own echoed
  // events simply converge local state onto server truth.
  useEffect(() => {
    const socket = getSocket();

    const join = () =>
      socket.emit('board:join', id, (res) => {
        if (res && !res.ok) setError(res.error || 'Realtime connection failed');
      });
    join();
    socket.on('connect', join); // re-join after any reconnect

    // Insert/replace a card into its list, kept sorted by position.
    const onCardUpsert = ({ card }) =>
      setCardsByList((prev) => {
        const next = {};
        for (const [listId, cards] of Object.entries(prev)) {
          next[listId] = cards.filter((c) => c._id !== card._id);
        }
        next[card.list] = [...(next[card.list] || []), card].sort(
          (a, b) => a.position - b.position
        );
        return next;
      });

    const onCardDeleted = ({ cardId }) =>
      setCardsByList((prev) => {
        const next = {};
        for (const [listId, cards] of Object.entries(prev)) {
          next[listId] = cards.filter((c) => c._id !== cardId);
        }
        return next;
      });

    const onListCreated = ({ list }) => {
      setLists((prev) =>
        prev.some((l) => l._id === list._id)
          ? prev
          : [...prev, list].sort((a, b) => a.position - b.position)
      );
      setCardsByList((prev) => (prev[list._id] ? prev : { ...prev, [list._id]: [] }));
    };

    const onListUpdated = ({ list }) =>
      setLists((prev) =>
        prev.map((l) => (l._id === list._id ? list : l)).sort((a, b) => a.position - b.position)
      );

    const onListDeleted = ({ listId }) => {
      setLists((prev) => prev.filter((l) => l._id !== listId));
      setCardsByList((prev) => {
        const next = { ...prev };
        delete next[listId];
        return next;
      });
    };

    socket.on('card:created', onCardUpsert);
    socket.on('card:updated', onCardUpsert);
    socket.on('card:deleted', onCardDeleted);
    socket.on('list:created', onListCreated);
    socket.on('list:updated', onListUpdated);
    socket.on('list:deleted', onListDeleted);

    return () => {
      socket.emit('board:leave', id);
      socket.off('connect', join);
      socket.off('card:created', onCardUpsert);
      socket.off('card:updated', onCardUpsert);
      socket.off('card:deleted', onCardDeleted);
      socket.off('list:created', onListCreated);
      socket.off('list:updated', onListUpdated);
      socket.off('list:deleted', onListDeleted);
    };
  }, [id]);

  const containerIds = useMemo(() => new Set(lists.map((l) => l._id)), [lists]);

  // Which list currently holds a given card (or list) id.
  function findContainer(itemId) {
    if (containerIds.has(itemId)) return itemId;
    return Object.keys(cardsByList).find((listId) =>
      cardsByList[listId].some((c) => c._id === itemId)
    );
  }

  function onDragStart({ active }) {
    setActiveCard(active.data.current?.card ?? null);
  }

  // Live-move the dragged card into the list it's hovering over.
  function onDragOver({ active, over }) {
    if (!over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to) return;

    setCardsByList((prev) => {
      const fromItems = prev[from];
      const toItems = prev[to];
      const moving = fromItems.find((c) => c._id === active.id);
      if (!moving) return prev;

      const overIndex = containerIds.has(over.id)
        ? toItems.length
        : toItems.findIndex((c) => c._id === over.id);

      return {
        ...prev,
        [from]: fromItems.filter((c) => c._id !== active.id),
        [to]: [
          ...toItems.slice(0, overIndex),
          { ...moving, list: to },
          ...toItems.slice(overIndex),
        ],
      };
    });
  }

  async function onDragEnd({ active, over }) {
    setActiveCard(null);
    if (!over) return;

    const to = findContainer(over.id);
    if (!to) return;

    const items = cardsByList[to];
    const oldIndex = items.findIndex((c) => c._id === active.id);
    const newIndex = containerIds.has(over.id)
      ? items.length - 1
      : items.findIndex((c) => c._id === over.id);

    const reordered = arrayMove(items, oldIndex, Math.max(newIndex, 0));
    const idx = reordered.findIndex((c) => c._id === active.id);
    const position = positionBetween(reordered[idx - 1], reordered[idx + 1]);

    // Reflect the new position locally so future drags compute correctly.
    reordered[idx] = { ...reordered[idx], position, list: to };
    setCardsByList((prev) => ({ ...prev, [to]: reordered }));

    try {
      await api.patch(`/cards/${active.id}`, { list: to, position });
    } catch (err) {
      setError(err.message);
    }
  }

  async function addList(e) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const { data } = await api.post(`/boards/${id}/lists`, {
        title: newListTitle.trim(),
      });
      setLists((prev) => [...prev, data.list]);
      setCardsByList((prev) => ({ ...prev, [data.list._id]: [] }));
      setNewListTitle('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function addCard(listId, title) {
    const { data } = await api.post(`/lists/${listId}/cards`, { title });
    setCardsByList((prev) => ({ ...prev, [listId]: [...prev[listId], data.card] }));
  }

  async function deleteList(listId) {
    await api.delete(`/lists/${listId}`);
    setLists((prev) => prev.filter((l) => l._id !== listId));
    setCardsByList((prev) => {
      const next = { ...prev };
      delete next[listId];
      return next;
    });
  }

  async function saveCard(cardId, patch) {
    const { data } = await api.patch(`/cards/${cardId}`, patch);
    setCardsByList((prev) => {
      const next = {};
      for (const [listId, cards] of Object.entries(prev)) {
        next[listId] = cards.map((c) => (c._id === cardId ? data.card : c));
      }
      return next;
    });
  }

  async function deleteCard(cardId) {
    await api.delete(`/cards/${cardId}`);
    setCardsByList((prev) => {
      const next = {};
      for (const [listId, cards] of Object.entries(prev)) {
        next[listId] = cards.filter((c) => c._id !== cardId);
      }
      return next;
    });
    setOpenCard(null);
  }

  if (loading) return <div className="p-8 text-slate-500">Loading board…</div>;
  if (error && !board) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/" className="text-sm text-slate-500 hover:underline">
          ← Boards
        </Link>
        <h1 className="text-xl font-semibold text-slate-800">{board?.title}</h1>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {lists.map((list) => (
            <ListColumn
              key={list._id}
              list={list}
              cards={cardsByList[list._id] || []}
              onAddCard={addCard}
              onDeleteList={deleteList}
              onOpenCard={setOpenCard}
            />
          ))}

          <form
            onSubmit={addList}
            className="w-72 shrink-0 rounded-lg bg-slate-200/50 p-3"
          >
            <input
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="+ Add a list"
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            />
          </form>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-lg">
              {activeCard.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {openCard && (
        <CardModal
          card={openCard}
          onSave={saveCard}
          onDelete={deleteCard}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  );
}
