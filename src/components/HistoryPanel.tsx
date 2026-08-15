import type { List } from '../lib/types';
import { useStore } from '../state/store';

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

export function HistoryPanel({ list }: { list: List }) {
  const { dispatch } = useStore();
  if (list.history.length === 0) return null;

  return (
    <details className="card history">
      <summary>History ({list.history.length})</summary>
      <ul>
        {list.history.map((entry) => (
          <li key={entry.id}>
            <div className="muted">{when(entry.at)}</div>
            <div>{entry.picked.join(', ')}</div>
          </li>
        ))}
      </ul>
      <button className="ghost danger" onClick={() => dispatch({ type: 'clearHistory', listId: list.id })}>
        Clear history
      </button>
    </details>
  );
}
