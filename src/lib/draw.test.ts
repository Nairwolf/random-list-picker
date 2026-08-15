import { describe, expect, it } from 'vitest';
import { reducer } from '../state/reducer';
import { draw, shuffleAll } from './draw';
import { emptyStore, newItem, newList, type List, type Store } from './types';

function listWith(labels: string[], patch: Partial<List> = {}): List {
  return { ...newList('test'), items: labels.map((l) => newItem(l)), ...patch };
}

describe('draw', () => {
  it('returns distinct items and leaves the pool alone by default', () => {
    const list = listWith(['a', 'b', 'c', 'd']);
    const out = draw(list, 3);
    expect(out.picked).toHaveLength(3);
    expect(new Set(out.picked.map((i) => i.id)).size).toBe(3);
    expect(out.drawnIds).toEqual([]);
  });

  it('accumulates the pool in exhaustive mode', () => {
    const list = listWith(['a', 'b', 'c'], { exhaustive: true });
    const out = draw(list, 2);
    expect(out.drawnIds).toHaveLength(2);
    const next = draw({ ...list, drawnIds: out.drawnIds }, 2);
    // Only one item is left, so a request for two returns one.
    expect(next.picked).toHaveLength(1);
    expect(out.drawnIds).not.toContain(next.picked[0].id);
  });

  it('reports exhaustion rather than silently resetting', () => {
    const list = listWith(['a'], { exhaustive: true });
    const first = draw(list, 1);
    const second = draw({ ...list, drawnIds: first.drawnIds }, 1);
    expect(second.picked).toEqual([]);
    expect(second.exhausted).toBe(true);
  });

  it('shuffles the whole list exactly once each', () => {
    const list = listWith(['a', 'b', 'c', 'd', 'e']);
    const out = shuffleAll(list).map((i) => i.label);
    expect(out.slice().sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

describe('exhaustive rotation through the reducer', () => {
  it('never repeats an id until the pool empties, and resets on demand', () => {
    let store: Store = { ...emptyStore(), lists: [listWith(['a', 'b', 'c', 'd', 'e'], { exhaustive: true })] };
    const listId = store.lists[0].id;
    const seen: string[] = [];

    for (let i = 0; i < 5; i++) {
      const list = store.lists[0];
      const out = draw(list, 1);
      expect(out.picked).toHaveLength(1);
      seen.push(out.picked[0].id);
      store = reducer(store, {
        type: 'recordDraw',
        listId,
        picked: out.picked.map((p) => p.label),
        drawnIds: out.drawnIds,
      });
    }

    expect(new Set(seen).size).toBe(5);
    expect(draw(store.lists[0], 1).exhausted).toBe(true);
    expect(store.lists[0].history).toHaveLength(5);

    store = reducer(store, { type: 'resetPool', listId });
    expect(store.lists[0].drawnIds).toEqual([]);
    expect(draw(store.lists[0], 1).picked).toHaveLength(1);
  });

  it('drops an item from the pool when the item is deleted', () => {
    const list = listWith(['a', 'b'], { exhaustive: true });
    let store: Store = { ...emptyStore(), lists: [list] };
    store = reducer(store, {
      type: 'recordDraw',
      listId: list.id,
      picked: ['a'],
      drawnIds: [list.items[0].id],
    });
    store = reducer(store, { type: 'deleteItem', listId: list.id, itemId: list.items[0].id });
    expect(store.lists[0].drawnIds).toEqual([]);
  });
});
