import { ListDetail } from './components/ListDetail';
import { ListsView } from './components/ListsView';
import { useStore } from './state/store';

export default function App() {
  const { selected, storageError, dismissStorageError } = useStore();

  return (
    <div className="app">
      {storageError && (
        <div className="banner" role="alert" style={{ margin: 8 }}>
          {storageError}
          <button className="ghost" onClick={dismissStorageError}>
            Dismiss
          </button>
        </div>
      )}
      {selected ? <ListDetail list={selected} /> : <ListsView />}
    </div>
  );
}
