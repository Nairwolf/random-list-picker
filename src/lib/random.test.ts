import { describe, expect, it } from 'vitest';
import { randomInt, sample, shuffle, weightedSample } from './random';

const nums = Array.from({ length: 20 }, (_, i) => i);

describe('randomInt', () => {
  it('stays in range', () => {
    for (let i = 0; i < 500; i++) {
      const n = randomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
  });

  it('covers the whole range', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randomInt(5));
    expect(seen.size).toBe(5);
  });
});

describe('shuffle', () => {
  it('preserves the multiset', () => {
    const out = shuffle(nums);
    expect(out).toHaveLength(nums.length);
    expect([...out].sort((a, b) => a - b)).toEqual(nums);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('sample', () => {
  it('returns k distinct elements', () => {
    for (let i = 0; i < 200; i++) {
      const out = sample(nums, 5);
      expect(out).toHaveLength(5);
      expect(new Set(out).size).toBe(5);
    }
  });

  it('caps at the pool size', () => {
    expect(sample(nums, 999)).toHaveLength(nums.length);
    expect(sample(nums, 0)).toHaveLength(0);
    expect(sample([], 3)).toHaveLength(0);
  });
});

describe('weightedSample', () => {
  const weightOf = (x: { w: number }) => x.w;

  it('favours heavy items roughly in proportion', () => {
    const heavy = { w: 9 };
    const light = { w: 1 };
    let heavyFirst = 0;
    const trials = 4000;
    for (let i = 0; i < trials; i++) {
      if (weightedSample([heavy, light], 1, weightOf)[0] === heavy) heavyFirst++;
    }
    // Expected 0.9; loose bounds so this can't flake.
    expect(heavyFirst / trials).toBeGreaterThan(0.85);
    expect(heavyFirst / trials).toBeLessThan(0.95);
  });

  it('never returns non-positive weights', () => {
    const items = [{ w: 0 }, { w: -1 }, { w: 5 }];
    for (let i = 0; i < 200; i++) {
      expect(weightedSample(items, 3, weightOf)).toEqual([items[2]]);
    }
  });

  it('returns k distinct items', () => {
    const items = nums.map((n) => ({ w: n + 1 }));
    const out = weightedSample(items, 6, weightOf);
    expect(out).toHaveLength(6);
    expect(new Set(out).size).toBe(6);
  });
});
