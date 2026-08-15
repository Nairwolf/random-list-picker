import { useMemo, useState } from 'react';
import { newItem, type List } from '../lib/types';
import { useStore } from '../state/store';
import { Sheet } from './Sheet';

export function BulkPasteSheet({ list, onClose }: { list: List; onClose: () => void }) {
  const { dispatch } = useStore();
  const [text, setText] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const { fresh, duplicates } = useMemo(() => {
    const existing = new Set(list.items.map((i) => i.label.trim().toLowerCase()));
    const seen = new Set<string>();
    const fresh: string[] = [];
    const duplicates: string[] = [];
    for (const raw of text.split('\n')) {
      const label = raw.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (existing.has(key) || seen.has(key)) duplicates.push(label);
      else fresh.push(label);
      seen.add(key);
    }
    return { fresh, duplicates };
  }, [text, list.items]);

  const total = fresh.length + duplicates.length;

  const add = () => {
    const labels = skipDuplicates ? fresh : [...fresh, ...duplicates];
    if (labels.length === 0) return;
    dispatch({ type: 'addItems', listId: list.id, items: labels.map((l) => newItem(l)) });
    onClose();
  };

  return (
    <Sheet title="Paste items" onClose={onClose}>
      <p className="muted">One item per line.</p>
      <textarea
        rows={8}
        autoFocus
        value={text}
        placeholder={'Alice\nBob\nCharlie'}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="muted">
        {total} {total === 1 ? 'line' : 'lines'}
        {duplicates.length > 0 &&
          ` · ${duplicates.length} ${duplicates.length === 1 ? 'duplicate' : 'duplicates'}`}
      </p>
      {duplicates.length > 0 && (
        <label className="toggle">
          <span>Skip duplicates</span>
          <input
            type="checkbox"
            checked={skipDuplicates}
            onChange={(e) => setSkipDuplicates(e.target.checked)}
          />
        </label>
      )}
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button className="primary" onClick={add} disabled={total === 0}>
          Add {skipDuplicates ? fresh.length : total}
        </button>
      </div>
    </Sheet>
  );
}
