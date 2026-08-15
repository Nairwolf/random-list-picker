import { draw, shuffleAll } from '../lib/draw';
import type { List } from '../lib/types';
import { useStore } from './store';

export type DrawState = {
  title: string;
  picked: string[];
} | null;

/** Runs a draw or a shuffle, records it in history, and hands back the result. */
export function useDraw(list: List, count: number, onResult: (r: DrawState) => void) {
  const { dispatch } = useStore();

  const runDraw = () => {
    const outcome = draw(list, count);
    if (outcome.exhausted) {
      onResult({ title: 'Pool exhausted', picked: [] });
      return;
    }
    if (outcome.picked.length === 0) return;
    const picked = outcome.picked.map((i) => i.label);
    dispatch({ type: 'recordDraw', listId: list.id, picked, drawnIds: outcome.drawnIds });
    onResult({ title: picked.length === 1 ? 'Picked' : `Picked ${picked.length}`, picked });
  };

  const runShuffle = () => {
    const picked = shuffleAll(list).map((i) => i.label);
    if (picked.length === 0) return;
    dispatch({ type: 'recordDraw', listId: list.id, picked, drawnIds: list.drawnIds });
    onResult({ title: 'Shuffled', picked });
  };

  return { runDraw, runShuffle };
}
