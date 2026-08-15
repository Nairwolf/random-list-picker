import { useEffect, useState } from 'react';
import { drawableItems } from '../lib/draw';
import type { List } from '../lib/types';
import { useStore } from '../state/store';
import { BulkPasteSheet } from './BulkPasteSheet';
import { CsvSheet } from './CsvSheet';
import { useDraw, type DrawState } from '../state/useDraw';
import { DrawControls } from './DrawPanel';
import { DrawResult } from './DrawResult';
import { HistoryPanel } from './HistoryPanel';
import { ItemEditor } from './ItemEditor';

export function ListDetail({ list }: { list: List }) {
  const { dispatch } = useStore();
  const [count, setCount] = useState(1);
  const [result, setResult] = useState<DrawState>(null);
  const [sheet, setSheet] = useState<'paste' | 'csv' | null>(null);

  const pool = drawableItems(list).length;
  const { runDraw, runShuffle } = useDraw(list, count, setResult);

  // Editing the list can shrink the pool below the chosen count.
  useEffect(() => {
    setCount((c) => Math.min(Math.max(c, 1), Math.max(pool, 1)));
  }, [pool]);

  // A different list means a stale result; clear it.
  useEffect(() => {
    setResult(null);
  }, [list.id]);

  return (
    <>
      <header className="topbar">
        <button
          className="icon-btn"
          onClick={() => dispatch({ type: 'selectList', id: null })}
          aria-label="Back to lists"
        >
          ←
        </button>
        <h1>{list.name}</h1>
        <button className="icon-btn" onClick={() => setSheet('csv')} aria-label="CSV import and export">
          ⇅
        </button>
      </header>

      <main className="content">
        <DrawControls list={list} count={count} setCount={setCount} />

        {result &&
          (result.picked.length > 0 ? (
            <DrawResult title={result.title} picked={result.picked} />
          ) : (
            <p className="banner">
              Every item has been drawn. Reset the pool to start over.
            </p>
          ))}

        <ItemEditor list={list} onBulkPaste={() => setSheet('paste')} />
        <HistoryPanel list={list} />
      </main>

      <footer className="draw-bar">
        <button onClick={runShuffle} disabled={list.items.length < 2}>
          Shuffle
        </button>
        <button className="primary" onClick={runDraw} disabled={pool === 0}>
          Draw {count}
        </button>
      </footer>

      {sheet === 'paste' && <BulkPasteSheet list={list} onClose={() => setSheet(null)} />}
      {sheet === 'csv' && <CsvSheet list={list} onClose={() => setSheet(null)} />}
    </>
  );
}
