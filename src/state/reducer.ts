import { HISTORY_LIMIT, newId, newList, type Item, type List, type Store } from '../lib/types';

export type Action =
  | { type: 'createList'; name: string }
  | { type: 'renameList'; id: string; name: string }
  | { type: 'deleteList'; id: string }
  | { type: 'selectList'; id: string | null }
  | { type: 'addItems'; listId: string; items: Item[] }
  | { type: 'replaceItems'; listId: string; items: Item[] }
  | { type: 'updateItem'; listId: string; itemId: string; patch: Partial<Omit<Item, 'id'>> }
  | { type: 'deleteItem'; listId: string; itemId: string }
  | { type: 'setWeighted'; listId: string; weighted: boolean }
  | { type: 'setExhaustive'; listId: string; exhaustive: boolean }
  | { type: 'recordDraw'; listId: string; picked: string[]; drawnIds: string[] }
  | { type: 'resetPool'; listId: string }
  | { type: 'clearHistory'; listId: string }
  | { type: 'setLists'; lists: List[]; selectedId: string | null };

function mapList(store: Store, id: string, fn: (list: List) => List): Store {
  return {
    ...store,
    lists: store.lists.map((list) =>
      list.id === id ? { ...fn(list), updatedAt: new Date().toISOString() } : list,
    ),
  };
}

export function reducer(store: Store, action: Action): Store {
  switch (action.type) {
    case 'createList': {
      const list = newList(action.name.trim() || 'Untitled list');
      return { ...store, lists: [...store.lists, list], selectedId: list.id };
    }
    case 'renameList':
      return mapList(store, action.id, (list) => ({
        ...list,
        name: action.name.trim() || list.name,
      }));
    case 'deleteList':
      return {
        ...store,
        lists: store.lists.filter((list) => list.id !== action.id),
        selectedId: store.selectedId === action.id ? null : store.selectedId,
      };
    case 'selectList':
      return { ...store, selectedId: action.id };
    case 'addItems':
      return mapList(store, action.listId, (list) => ({
        ...list,
        items: [...list.items, ...action.items],
      }));
    case 'replaceItems':
      // A wholesale replacement invalidates the pool: those ids are gone.
      return mapList(store, action.listId, (list) => ({
        ...list,
        items: action.items,
        drawnIds: [],
      }));
    case 'updateItem':
      return mapList(store, action.listId, (list) => ({
        ...list,
        items: list.items.map((item) =>
          item.id === action.itemId ? { ...item, ...action.patch } : item,
        ),
      }));
    case 'deleteItem':
      return mapList(store, action.listId, (list) => ({
        ...list,
        items: list.items.filter((item) => item.id !== action.itemId),
        drawnIds: list.drawnIds.filter((id) => id !== action.itemId),
      }));
    case 'setWeighted':
      return mapList(store, action.listId, (list) => ({ ...list, weighted: action.weighted }));
    case 'setExhaustive':
      return mapList(store, action.listId, (list) => ({ ...list, exhaustive: action.exhaustive }));
    case 'recordDraw':
      return mapList(store, action.listId, (list) => ({
        ...list,
        drawnIds: action.drawnIds,
        history: [
          { id: newId(), at: new Date().toISOString(), picked: action.picked },
          ...list.history,
        ].slice(0, HISTORY_LIMIT),
      }));
    case 'resetPool':
      return mapList(store, action.listId, (list) => ({ ...list, drawnIds: [] }));
    case 'clearHistory':
      return mapList(store, action.listId, (list) => ({ ...list, history: [] }));
    case 'setLists':
      return { ...store, lists: action.lists, selectedId: action.selectedId };
  }
}
