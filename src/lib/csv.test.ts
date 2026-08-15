import { describe, expect, it } from 'vitest';
import { fromCsv, toCsv } from './csv';
import { newItem } from './types';

describe('csv', () => {
  it('round-trips awkward labels', () => {
    const items = [
      newItem('plain', 1),
      newItem('with, comma', 2.5),
      newItem('with "quotes"', 1),
      newItem('with\nnewline', 3),
    ];
    const parsed = fromCsv(toCsv(items));
    expect(parsed.errors).toEqual([]);
    expect(parsed.items.map((i) => [i.label, i.weight])).toEqual(
      items.map((i) => [i.label, i.weight]),
    );
  });

  it('accepts a single column and defaults weights to 1', () => {
    const { items, errors } = fromCsv('Alice\nBob\nCharlie\n');
    expect(errors).toEqual([]);
    expect(items.map((i) => i.label)).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(items.every((i) => i.weight === 1)).toBe(true);
  });

  it('strips a UTF-8 BOM and drops the header row', () => {
    const { items } = fromCsv('﻿label,weight\r\nAlice,2\r\n');
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('Alice');
    expect(items[0].weight).toBe(2);
  });

  it('keeps a first row that is not a header', () => {
    const { items } = fromCsv('Alice,2\nBob,1');
    expect(items.map((i) => i.label)).toEqual(['Alice', 'Bob']);
  });

  it('reports bad rows instead of dropping them silently', () => {
    const { items, errors } = fromCsv('label,weight\nAlice,abc\n,3\nBob,1\n\n');
    expect(items.map((i) => i.label)).toEqual(['Alice', 'Bob']);
    expect(items[0].weight).toBe(1);
    expect(errors).toHaveLength(2);
  });
});
