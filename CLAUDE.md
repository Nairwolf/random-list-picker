# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev              # dev server on :5173
npm run dev -- --host    # expose on the LAN to test from a real phone
npm run build            # tsc -b && vite build -> dist/
npm run preview          # serve the production build
npm run test             # vitest run (single pass)
npm run test:watch
npm run lint             # oxlint
```

Run one test file or one case:

```sh
npx vitest run src/lib/csv.test.ts
npx vitest run -t 'round-trips awkward labels'
```

## Architecture

Pure-frontend SPA. No backend, no network calls at runtime, no auth. Deploys as static files
(Vercel, `picker.nairwolf.net`).

**Three layers, and the boundary between them matters:**

1. `src/lib/` — framework-free TypeScript. No React imports. This is where all the logic lives
   (sampling, CSV, persistence, backup, draw semantics) and where **all tests live**. New logic
   belongs here, not in a component.
2. `src/state/` — a single `useReducer` (`reducer.ts`) behind a context provider (`store.tsx`).
   All mutations go through dispatched actions; components never write storage directly.
3. `src/components/` — presentation only. Untested by design; keep them thin enough that this
   stays true.

### Persistence

The entire store is one JSON blob in `localStorage` under `rlp.v1`, rewritten wholesale on a 300ms
debounce from an effect in `store.tsx`.

`parseStore()` in `src/lib/storage.ts` is the validation boundary and **must never throw** — a
corrupt or foreign payload has to degrade to an empty store, because a thrown error here bricks the
app on load with no way for the user to recover. It also repairs invariants the type system can't:
dropping `drawnIds` for items that no longer exist, and clearing a `selectedId` that points at a
missing list.

If you add a field to `List` or `Item`, add it to `coerceList()` too. `storage.test.ts` round-trips
a full store through `parseStore` and will fail if the two drift apart.

`Store.version` exists so a future schema change has something to branch on; there is only `1` so far.

### Draw semantics

`src/lib/draw.ts` is the whole model:

- **Exhaustive mode** (`list.exhaustive`) tracks used items in `list.drawnIds`. A draw appends to
  it. When the pool empties, `draw()` returns `exhausted: true` and picks nothing — it deliberately
  does **not** auto-reset; the user resets explicitly.
- Any reducer action that removes items must keep `drawnIds` consistent (see `deleteItem` and
  `replaceItems`), or the "n of m left" counter lies.
- **Weighted mode** uses Efraimidis–Spirakis (`u^(1/w)`, keep the k largest keys) so weights hold
  correctly *without replacement* in a single pass. Weight `<= 0` excludes an item entirely.
- **Shuffle** ignores the exhaustive pool by design — you asked to order the whole list — and leaves
  `drawnIds` untouched.

All randomness comes from `crypto.getRandomValues` with rejection sampling in `randomInt` to avoid
modulo bias. Do not reach for `Math.random`.

### Routing

There is no router dependency. `store.selectedId` is the single source of truth; an effect mirrors
it to `location.hash` (`#/list/<id>`) via `pushState`, and a `popstate` listener maps the hash back
into state. This is what makes the Android/browser back button exit a list instead of the app.
`selected === null` renders `ListsView`, otherwise `ListDetail`.

## Mobile-first constraints

The phone is the primary target; desktop is a single `min-width: 768px` enhancement at the bottom
of `src/styles.css`. These are load-bearing, not cosmetic:

- `.app` is a fixed-height (`100dvh`) flex column with `overflow: hidden`; only `.content` scrolls.
  The Draw bar is a flow footer, not `position: sticky` — sticky fights the collapsing mobile URL
  bar. Don't "simplify" this back to a scrolling body.
- Inputs must stay at `font-size: 16px` minimum or iOS Safari zooms the page on focus.
- Interactive targets are `>= 44px` (`--tap`); bottom-anchored UI needs
  `env(safe-area-inset-bottom)`.
- Animations are paired with `prefers-reduced-motion` overrides.

Verify UI changes at ~390px width, not just on desktop.

## Notes

- iOS in-app browsers swallow blob downloads, so every export is paired with a copy-to-clipboard
  fallback (`copyToClipboard` in `src/lib/download.ts`). Keep that pairing when adding exports.
- CSV parsing is hand-rolled in `src/lib/csv.ts` (RFC4180-ish: quoted commas/newlines, BOM
  stripping, optional weight column) specifically to avoid a dependency. Extend it rather than
  adding a parser library.
- The remaining `oxlint` warning in `store.tsx` (`only-export-components`) is the standard
  provider+hook colocation and is expected.
