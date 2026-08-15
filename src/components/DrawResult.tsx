import { useState } from 'react';
import { copyToClipboard } from '../lib/download';

type Props = {
  title: string;
  picked: string[];
};

export function DrawResult({ title, picked }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copyToClipboard(picked.join('\n'));
    setCopied(ok);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="card result" aria-live="polite">
      <div className="row between">
        <strong>{title}</strong>
        <button className="ghost" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <ol>
        {picked.map((label, i) => (
          // Labels can repeat across a list, so index is the only stable key here.
          <li key={`${i}-${label}`}>{label}</li>
        ))}
      </ol>
    </section>
  );
}
