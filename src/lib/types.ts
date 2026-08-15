export type Item = {
  id: string;
  label: string;
  weight: number;
};

export type Draw = {
  id: string;
  at: string;
  picked: string[];
};

export type List = {
  id: string;
  name: string;
  items: Item[];
  weighted: boolean;
  exhaustive: boolean;
  drawnIds: string[];
  history: Draw[];
  createdAt: string;
  updatedAt: string;
};

export type Store = {
  version: 1;
  lists: List[];
  selectedId: string | null;
};

export const STORAGE_KEY = 'rlp.v1';
export const HISTORY_LIMIT = 50;

export function newId(): string {
  return crypto.randomUUID();
}

export function emptyStore(): Store {
  return { version: 1, lists: [], selectedId: null };
}

export function newList(name: string): List {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name,
    items: [],
    weighted: false,
    exhaustive: false,
    drawnIds: [],
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function newItem(label: string, weight = 1): Item {
  return { id: newId(), label, weight };
}
