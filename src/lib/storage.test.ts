import { describe, expect, it } from 'vitest';
import { mergeLists, readBackup, toBackupJson } from './backup';
import { parseStore } from './storage';
import { emptyStore, newItem, newList, type Store } from './types';

function storeWith(): Store {
  const list = newList('People');
  list.items = [newItem('Alice', 2), newItem('Bob')];
  list.drawnIds = [list.items[0].id];
  return { ...emptyStore(), lists: [list], selectedId: list.id };
}

describe('parseStore', () => {
  it('round-trips a real store', () => {
    const store = storeWith();
    const parsed = parseStore(JSON.stringify(store));
    expect(parsed).toEqual(store);
  });

  it('falls back to empty on garbage', () => {
    expect(parseStore('not json')).toEqual(emptyStore());
    expect(parseStore(null)).toEqual(emptyStore());
    expect(parseStore('[1,2,3]')).toEqual(emptyStore());
  });

  it('drops pool ids for items that no longer exist', () => {
    const store = storeWith();
    store.lists[0].drawnIds = ['ghost-id'];
    expect(parseStore(JSON.stringify(store)).lists[0].drawnIds).toEqual([]);
  });

  it('clears a selection pointing at a missing list', () => {
    const store = { ...emptyStore(), selectedId: 'gone' };
    expect(parseStore(JSON.stringify(store)).selectedId).toBeNull();
  });
});

describe('backup', () => {
  it('reads back what it exports', () => {
    const store = storeWith();
    const { lists, error } = readBackup(toBackupJson(store));
    expect(error).toBeNull();
    expect(lists).toEqual(store.lists);
  });

  it('rejects foreign files with a message', () => {
    expect(readBackup('nope').error).toBeTruthy();
    expect(readBackup('{"hello":1}').error).toBeTruthy();
    expect(readBackup('{"lists":[]}').error).toBeTruthy();
  });

  it('merges without overwriting a colliding id', () => {
    const store = storeWith();
    const merged = mergeLists(store.lists, store.lists);
    expect(merged).toHaveLength(2);
    expect(merged[0].id).not.toBe(merged[1].id);
    expect(merged[1].name).toContain('imported');
  });
});
