/**
 * All randomness comes from crypto.getRandomValues rather than Math.random:
 * draws are the whole point of this app, so they should be defensibly fair.
 */

/** Uniform integer in [0, n) via rejection sampling, so there is no modulo bias. */
export function randomInt(n: number): number {
  if (n <= 0) throw new RangeError('randomInt requires n > 0');
  if (n === 1) return 0;
  const buf = new Uint32Array(1);
  // Largest multiple of n that fits in a uint32; anything above it is rejected.
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % n;
}

/** Uniform float in (0, 1) — never exactly 0, so log/pow stay finite. */
function randomFloat(): number {
  const buf = new Uint32Array(1);
  let value = 0;
  while (value === 0) {
    crypto.getRandomValues(buf);
    value = buf[0];
  }
  return value / 0x1_0000_0000;
}

/** Fisher-Yates. Returns a new array; the input is untouched. */
export function shuffle<T>(input: readonly T[]): T[] {
  const out = input.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** k distinct elements, uniformly. Partial Fisher-Yates: stops after k swaps. */
export function sample<T>(input: readonly T[], k: number): T[] {
  const n = input.length;
  const take = Math.min(Math.max(k, 0), n);
  const pool = input.slice();
  for (let i = 0; i < take; i++) {
    const j = i + randomInt(n - i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, take);
}

/**
 * k distinct elements with probability proportional to weight, via
 * Efraimidis-Spirakis: give each item the key u^(1/w) and keep the k largest.
 * One pass, no replacement, no renormalizing after each pick.
 *
 * Items with weight <= 0 (or non-finite) are excluded entirely.
 */
export function weightedSample<T>(
  input: readonly T[],
  k: number,
  weightOf: (item: T) => number,
): T[] {
  const eligible: { item: T; key: number }[] = [];
  for (const item of input) {
    const w = weightOf(item);
    if (!Number.isFinite(w) || w <= 0) continue;
    eligible.push({ item, key: Math.pow(randomFloat(), 1 / w) });
  }
  eligible.sort((a, b) => b.key - a.key);
  return eligible.slice(0, Math.min(Math.max(k, 0), eligible.length)).map((e) => e.item);
}
