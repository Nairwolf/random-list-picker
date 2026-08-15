# Random List Picker

Keep named lists in your browser and draw random elements from them. Pure frontend — no backend,
no accounts, nothing leaves the device. Built mobile-first; the phone layout is the design and the
desktop layout is the enhancement.

## What it does

- **Draw X items** at once, never repeating within a draw.
- **No repeats until exhausted** — a per-list rotation mode that remembers who has already come up
  across sessions, until you reset the pool.
- **Weighted draw** — optional per-list toggle that reveals a weight field on each item. Weight `0`
  excludes an item. Sampling uses Efraimidis–Spirakis, so weights hold without replacement.
- **Shuffle** — random order for the whole list.
- **History** — the last 50 draws per list.
- **Bulk paste** — one item per line, with duplicate detection.
- **CSV import/export** per list (`label,weight`; the weight column is optional) and a **JSON
  backup** of everything.

Randomness comes from `crypto.getRandomValues` with rejection sampling, not `Math.random`.

## Storage

Everything lives in `localStorage` under the key `rlp.v1`. That means it is per-browser and
per-device, and clearing browsing data wipes it. Use Settings → Export all (JSON) for a real
backup.

## Develop

```sh
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # reachable from a phone on the same network
npm run test
npm run lint
npm run build && npm run preview
```

## Layout

```
src/lib/       types, random, draw, csv, storage, backup, download — all framework-free and tested
src/state/     useReducer store + context, persistence, hash-based selection
src/components/ ListsView / ListDetail and the sheets
```

## Deploy

Static build, output `dist/`. On Vercel: import the repo, framework preset **Vite**, then add
`picker.nairwolf.net` under Settings → Domains and point a CNAME at Vercel. No rewrites needed —
routing is hash-based, so there is nothing for the server to resolve.
