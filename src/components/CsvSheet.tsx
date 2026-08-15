import { useRef, useState } from 'react';
import { fromCsv, toCsv } from '../lib/csv';
import { copyToClipboard, downloadText, slugify } from '../lib/download';
import type { Item, List } from '../lib/types';
import { useStore } from '../state/store';
import { Sheet } from './Sheet';

export function CsvSheet({ list, onClose }: { list: List; onClose: () => void }) {
  const { dispatch } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ items: Item[]; errors: string[] } | null>(null);
  const [copied, setCopied] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = fromCsv(await file.text());
    setPending(result);
  };

  const apply = (mode: 'append' | 'replace') => {
    if (!pending) return;
    dispatch(
      mode === 'append'
        ? { type: 'addItems', listId: list.id, items: pending.items }
        : { type: 'replaceItems', listId: list.id, items: pending.items },
    );
    setPending(null);
    onClose();
  };

  const csv = toCsv(list.items);

  return (
    <Sheet title="CSV" onClose={onClose}>
      {pending ? (
        <>
          <p>
            Found {pending.items.length} {pending.items.length === 1 ? 'item' : 'items'}.
          </p>
          {pending.errors.length > 0 && (
            <div className="banner">
              {pending.errors.slice(0, 5).map((e) => (
                <div key={e}>{e}</div>
              ))}
              {pending.errors.length > 5 && <div>…and {pending.errors.length - 5} more.</div>}
            </div>
          )}
          <div className="actions">
            <button onClick={() => apply('append')} disabled={pending.items.length === 0}>
              Add to list
            </button>
            <button
              className="danger"
              onClick={() => apply('replace')}
              disabled={pending.items.length === 0}
            >
              Replace list
            </button>
          </div>
          <button className="ghost" onClick={() => setPending(null)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <p className="muted">Columns: label, weight. Weight is optional and defaults to 1.</p>
          <div className="actions">
            <button
              disabled={list.items.length === 0}
              onClick={() => downloadText(`${slugify(list.name)}.csv`, 'text/csv', csv)}
            >
              Export CSV
            </button>
            <button onClick={() => fileInput.current?.click()}>Import CSV</button>
          </div>
          {/* In-app browsers on iOS often swallow blob downloads; clipboard always works. */}
          <button
            className="ghost"
            disabled={list.items.length === 0}
            onClick={async () => {
              const ok = await copyToClipboard(csv);
              setCopied(ok);
              setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? 'Copied to clipboard' : 'Copy CSV instead'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </>
      )}
    </Sheet>
  );
}
