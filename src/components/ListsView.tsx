import { useState } from 'react';
import { useStore } from '../state/store';
import { Sheet } from './Sheet';
import { SettingsSheet } from './SettingsSheet';

export function ListsView() {
  const { store, dispatch } = useStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);

  const create = () => {
    dispatch({ type: 'createList', name });
    setName('');
    setCreating(false);
  };

  const renameTarget = store.lists.find((l) => l.id === renaming) ?? null;

  return (
    <>
      <header className="topbar">
        <h1>Random List Picker</h1>
        <button className="icon-btn" onClick={() => setSettings(true)} aria-label="Settings">
          ⚙
        </button>
      </header>

      <main className="content">
        {store.lists.length === 0 ? (
          <p className="empty">No lists yet. Create one to start drawing.</p>
        ) : (
          <ul className="list-cards">
            {store.lists.map((list) => (
              <li key={list.id} className="list-card">
                <button className="open" onClick={() => dispatch({ type: 'selectList', id: list.id })}>
                  <span className="name">{list.name}</span>
                  <span className="muted">
                    {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                    {list.exhaustive && list.drawnIds.length > 0
                      ? ` · ${list.items.length - list.drawnIds.length} left in pool`
                      : ''}
                  </span>
                </button>
                <button
                  className="icon-btn"
                  onClick={() => {
                    setName(list.name);
                    setRenaming(list.id);
                  }}
                  aria-label={`Rename ${list.name}`}
                >
                  ✎
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => {
                    if (confirm(`Delete "${list.name}" and its ${list.items.length} items?`)) {
                      dispatch({ type: 'deleteList', id: list.id });
                    }
                  }}
                  aria-label={`Delete ${list.name}`}
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="fab">
          <button
            className="primary"
            onClick={() => {
              setName('');
              setCreating(true);
            }}
          >
            + New list
          </button>
        </div>
      </main>

      {creating && (
        <Sheet title="New list" onClose={() => setCreating(false)}>
          <input
            type="text"
            autoFocus
            value={name}
            placeholder="List name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <div className="actions">
            <button onClick={() => setCreating(false)}>Cancel</button>
            <button className="primary" onClick={create}>
              Create
            </button>
          </div>
        </Sheet>
      )}

      {renameTarget && (
        <Sheet title="Rename list" onClose={() => setRenaming(null)}>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              dispatch({ type: 'renameList', id: renameTarget.id, name });
              setRenaming(null);
            }}
          />
          <div className="actions">
            <button onClick={() => setRenaming(null)}>Cancel</button>
            <button
              className="primary"
              onClick={() => {
                dispatch({ type: 'renameList', id: renameTarget.id, name });
                setRenaming(null);
              }}
            >
              Save
            </button>
          </div>
        </Sheet>
      )}

      {settings && <SettingsSheet onClose={() => setSettings(false)} />}
    </>
  );
}
