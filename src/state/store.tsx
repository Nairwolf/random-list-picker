import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { load, save, StorageError } from '../lib/storage';
import type { List, Store } from '../lib/types';
import { reducer, type Action } from './reducer';

type Ctx = {
  store: Store;
  selected: List | null;
  dispatch: (action: Action) => void;
  storageError: string | null;
  dismissStorageError: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

function hashId(): string | null {
  const match = /^#\/list\/(.+)$/.exec(location.hash);
  return match ? decodeURIComponent(match[1]) : null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(reducer, null, () => {
    const loaded = load();
    // The URL wins on load, so a bookmark or a reload reopens the right list.
    const fromHash = hashId();
    if (fromHash && loaded.lists.some((l) => l.id === fromHash)) {
      return { ...loaded, selectedId: fromHash };
    }
    return loaded;
  });
  const [storageError, setStorageError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Debounced persist: typing in an item label shouldn't hit localStorage per keystroke.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        save(store);
        setStorageError(null);
      } catch (err) {
        setStorageError(err instanceof StorageError ? err.message : String(err));
      }
    }, 300) as unknown as number;
    return () => clearTimeout(timer.current);
  }, [store]);

  // Mirror selection into the hash so the device back button leaves a list
  // instead of leaving the app.
  useEffect(() => {
    const target = store.selectedId ? `#/list/${encodeURIComponent(store.selectedId)}` : '#/';
    if (location.hash !== target) history.pushState(null, '', target);
  }, [store.selectedId]);

  useEffect(() => {
    const onPop = () => dispatch({ type: 'selectList', id: hashId() });
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  const selected = useMemo(
    () => store.lists.find((l) => l.id === store.selectedId) ?? null,
    [store.lists, store.selectedId],
  );

  const dismissStorageError = useCallback(() => setStorageError(null), []);

  const value = useMemo(
    () => ({ store, selected, dispatch, storageError, dismissStorageError }),
    [store, selected, storageError, dismissStorageError],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
