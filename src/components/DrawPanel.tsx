import { drawableItems } from '../lib/draw';
import type { List } from '../lib/types';
import { useStore } from '../state/store';

type Props = {
  list: List;
  count: number;
  setCount: (n: number) => void;
};

/** The settings card. The Draw button itself lives in ListDetail's footer bar. */
export function DrawControls({ list, count, setCount }: Props) {
  const { dispatch } = useStore();
  const pool = drawableItems(list).length;
  const remaining = list.items.length - list.drawnIds.length;

  return (
    <section className="card">
      <div className="stepper">
        <button onClick={() => setCount(Math.max(1, count - 1))} aria-label="One fewer" disabled={count <= 1}>
          −
        </button>
        <div className="count" aria-live="polite">
          {count}
        </div>
        <button
          onClick={() => setCount(Math.min(Math.max(pool, 1), count + 1))}
          aria-label="One more"
          disabled={count >= pool}
        >
          +
        </button>
      </div>
      <p className="muted" style={{ textAlign: 'center' }}>
        {count === 1 ? 'item' : 'items'} from {pool} available
      </p>

      <label className="toggle">
        <span>
          No repeats until exhausted
          {list.exhaustive && (
            <span className="muted">
              {' '}
              — {remaining} of {list.items.length} left
            </span>
          )}
        </span>
        <input
          type="checkbox"
          checked={list.exhaustive}
          onChange={(e) => dispatch({ type: 'setExhaustive', listId: list.id, exhaustive: e.target.checked })}
        />
      </label>

      <label className="toggle">
        <span>Weighted draw</span>
        <input
          type="checkbox"
          checked={list.weighted}
          onChange={(e) => dispatch({ type: 'setWeighted', listId: list.id, weighted: e.target.checked })}
        />
      </label>

      {list.exhaustive && list.drawnIds.length > 0 && (
        <button className="ghost" onClick={() => dispatch({ type: 'resetPool', listId: list.id })}>
          Reset pool
        </button>
      )}
    </section>
  );
}
