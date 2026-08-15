import { emptyStore, STORAGE_KEY, type Item, type List, type Store } from './types';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function coerceItem(raw: unknown): Item | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const label = asString(r.label);
  if (!label) return null;
  const weight = typeof r.weight === 'number' && Number.isFinite(r.weight) ? r.weight : 1;
  return { id: asString(r.id) || crypto.randomUUID(), label, weight };
}

export function coerceList(raw: unknown): List | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const now = new Date().toISOString();
  const items = Array.isArray(r.items)
    ? (r.items.map(coerceItem).filter(Boolean) as Item[])
    : [];
  const ids = new Set(items.map((i) => i.id));
  return {
    id: asString(r.id) || crypto.randomUUID(),
    name: asString(r.name, 'Untitled list'),
    items,
    weighted: r.weighted === true,
    exhaustive: r.exhaustive === true,
    // Drop pool entries for items that no longer exist, or "n remaining" lies.
    drawnIds: Array.isArray(r.drawnIds)
      ? r.drawnIds.filter((id): id is string => typeof id === 'string' && ids.has(id))
      : [],
    history: Array.isArray(r.history)
      ? r.history.flatMap((h) => {
          if (typeof h !== 'object' || h === null) return [];
          const e = h as Record<string, unknown>;
          const picked = Array.isArray(e.picked)
            ? e.picked.filter((p): p is string => typeof p === 'string')
            : [];
          return [{ id: asString(e.id) || crypto.randomUUID(), at: asString(e.at, now), picked }];
        })
      : [],
    createdAt: asString(r.createdAt, now),
    updatedAt: asString(r.updatedAt, now),
  };
}

/** Never throws: a corrupt or foreign payload yields an empty store. */
export function parseStore(text: string | null): Store {
  if (!text) return emptyStore();
  try {
    const raw: unknown = JSON.parse(text);
    if (typeof raw !== 'object' || raw === null) return emptyStore();
    const r = raw as Record<string, unknown>;
    const lists = Array.isArray(r.lists)
      ? (r.lists.map(coerceList).filter(Boolean) as List[])
      : [];
    const selectedId = typeof r.selectedId === 'string' ? r.selectedId : null;
    return {
      version: 1,
      lists,
      selectedId: lists.some((l) => l.id === selectedId) ? selectedId : null,
    };
  } catch {
    return emptyStore();
  }
}

export function load(): Store {
  try {
    return parseStore(localStorage.getItem(STORAGE_KEY));
  } catch {
    // localStorage can throw outright in private modes / blocked-cookie setups.
    return emptyStore();
  }
}

export class StorageError extends Error {}

export function save(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    const quota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    throw new StorageError(
      quota
        ? 'Browser storage is full — export a JSON backup and delete some lists.'
        : 'Could not save to browser storage. Changes may be lost when you close this tab.',
    );
  }
}
