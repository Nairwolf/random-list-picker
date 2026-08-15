import { useState } from 'react';
import { newItem, type List } from '../lib/types';
import { useStore } from '../state/store';

export function ItemEditor({ list, onBulkPaste }: { list: List; onBulkPaste: () => void }) {
  const { dispatch } = useStore();
  const [adding, setAdding] = useState('');
  const drawn = new Set(list.drawnIds);

  const add = () => {
    const label = adding.trim();
    if (!label) return;
    dispatch({ type: 'addItems', listId: list.id, items: [newItem(label)] });
    setAdding('');
  };

  return (
    <section className="card">
      <div className="row between" style={{ marginBottom: 12 }}>
        <strong>
          Items <span className="muted">({list.items.length})</span>
        </strong>
        <button className="ghost" onClick={onBulkPaste}>
          Paste many
        </button>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={adding}
          placeholder="Add an item"
          enterKeyHint="done"
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button onClick={add} disabled={!adding.trim()} aria-label="Add item">
          Add
        </button>
      </div>

      <ul className="items">
        {list.items.map((item) => (
          <li key={item.id} className={`item-row${drawn.has(item.id) ? ' drawn' : ''}`}>
            <input
              type="text"
              value={item.label}
              aria-label="Item label"
              onChange={(e) =>
                dispatch({
                  type: 'updateItem',
                  listId: list.id,
                  itemId: item.id,
                  patch: { label: e.target.value },
                })
              }
            />
            {list.weighted && (
              <input
                type="number"
                className="weight"
                min={0}
                step="any"
                inputMode="decimal"
                aria-label={`Weight for ${item.label}`}
                value={item.weight}
                onChange={(e) => {
                  const weight = Number(e.target.value);
                  dispatch({
                    type: 'updateItem',
                    listId: list.id,
                    itemId: item.id,
                    patch: { weight: Number.isFinite(weight) && weight >= 0 ? weight : 0 },
                  });
                }}
              />
            )}
            <button
              className="icon-btn danger"
              aria-label={`Delete ${item.label}`}
              onClick={() => dispatch({ type: 'deleteItem', listId: list.id, itemId: item.id })}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {list.items.length === 0 && <p className="empty">No items yet.</p>}
    </section>
  );
}
