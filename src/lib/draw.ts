import { sample, shuffle, weightedSample } from './random';
import type { Item, List } from './types';

export type DrawOutcome = {
  picked: Item[];
  /** Pool state after the draw; unchanged unless the list is in exhaustive mode. */
  drawnIds: string[];
  /** True when exhaustive mode had nothing left to draw. */
  exhausted: boolean;
};

/** Items still available: everything, minus the pool in exhaustive mode. */
export function availableItems(list: List): Item[] {
  if (!list.exhaustive) return list.items;
  const drawn = new Set(list.drawnIds);
  return list.items.filter((item) => !drawn.has(item.id));
}

/** Items a draw can actually return — weighted mode ignores weight <= 0. */
export function drawableItems(list: List): Item[] {
  const available = availableItems(list);
  return list.weighted ? available.filter((i) => i.weight > 0) : available;
}

function pick(list: List, pool: Item[], count: number): Item[] {
  return list.weighted
    ? weightedSample(pool, count, (item) => item.weight)
    : sample(pool, count);
}

export function draw(list: List, count: number): DrawOutcome {
  const pool = drawableItems(list);
  if (pool.length === 0) {
    return { picked: [], drawnIds: list.drawnIds, exhausted: list.exhaustive };
  }
  const picked = pick(list, pool, count);
  return {
    picked,
    drawnIds: list.exhaustive ? [...list.drawnIds, ...picked.map((i) => i.id)] : list.drawnIds,
    exhausted: false,
  };
}

/**
 * Shuffle is a full-list draw: every item, in random order. It deliberately
 * ignores the exhaustive pool — you asked to order the whole list, not a
 * remainder — and so leaves the pool untouched.
 */
export function shuffleAll(list: List): Item[] {
  return list.weighted
    ? weightedSample(list.items, list.items.length, (item) => item.weight)
    : shuffle(list.items);
}
