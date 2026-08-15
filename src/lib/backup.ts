import { downloadText } from './download';
import { parseStore } from './storage';
import type { List, Store } from './types';

export function backupFilename(now = new Date()): string {
  return `random-list-picker-${now.toISOString().slice(0, 10)}.json`;
}

export function toBackupJson(store: Store): string {
  return JSON.stringify(store, null, 2);
}

export function exportAll(store: Store): void {
  downloadText(backupFilename(), 'application/json', toBackupJson(store));
}

/**
 * Parses a backup file. Returns the lists it contains rather than a whole
 * Store, since the caller decides between merge and replace.
 */
export function readBackup(text: string): { lists: List[]; error: string | null } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { lists: [], error: "That file isn't valid JSON." };
  }
  if (typeof raw !== 'object' || raw === null || !Array.isArray((raw as Record<string, unknown>).lists)) {
    return { lists: [], error: "That doesn't look like a Random List Picker backup." };
  }
  const { lists } = parseStore(text);
  if (lists.length === 0) {
    return { lists: [], error: 'That backup contains no lists.' };
  }
  return { lists, error: null };
}

/** Merge keeps both sides; incoming lists get fresh ids so nothing is overwritten. */
export function mergeLists(existing: List[], incoming: List[]): List[] {
  const taken = new Set(existing.map((l) => l.id));
  const merged = incoming.map((list) => {
    if (!taken.has(list.id)) {
      taken.add(list.id);
      return list;
    }
    const id = crypto.randomUUID();
    taken.add(id);
    return { ...list, id, name: `${list.name} (imported)` };
  });
  return [...existing, ...merged];
}
