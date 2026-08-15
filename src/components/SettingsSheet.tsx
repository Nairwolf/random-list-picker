import { useRef, useState } from 'react';
import { exportAll, mergeLists, readBackup } from '../lib/backup';
import { useStore } from '../state/store';
import type { List } from '../lib/types';
import { Sheet } from './Sheet';

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { store, dispatch } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<List[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const { lists, error: err } = readBackup(await file.text());
    if (err) {
      setError(err);
      return;
    }
    setPending(lists);
  };

  const apply = (mode: 'merge' | 'replace') => {
    if (!pending) return;
    const lists = mode === 'merge' ? mergeLists(store.lists, pending) : pending;
    dispatch({ type: 'setLists', lists, selectedId: null });
    setPending(null);
    onClose();
  };

  return (
    <Sheet title="Backup" onClose={onClose}>
      {error && <p className="banner">{error}</p>}

      {pending ? (
        <>
          <p>
            This backup has {pending.length} {pending.length === 1 ? 'list' : 'lists'}. Merge them
            with your {store.lists.length} existing {store.lists.length === 1 ? 'list' : 'lists'},
            or replace everything?
          </p>
          <div className="actions">
            <button onClick={() => apply('merge')}>Merge</button>
            <button className="danger" onClick={() => apply('replace')}>
              Replace all
            </button>
          </div>
          <button className="ghost" onClick={() => setPending(null)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <p className="muted">
            Everything lives in this browser only. Export a backup before clearing browsing data or
            switching device.
          </p>
          <div className="actions">
            <button onClick={() => exportAll(store)} disabled={store.lists.length === 0}>
              Export all (JSON)
            </button>
            <button onClick={() => fileInput.current?.click()}>Import backup</button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </>
      )}
    </Sheet>
  );
}
