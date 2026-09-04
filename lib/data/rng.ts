// Deterministic seeded PRNG (mulberry32) so the entire synthetic dataset,
// including the injected incident, regenerates identically on every run.

export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function randInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randFloat(rng: RNG, min: number, max: number): number {
  return rng() * (max - min) + min;
}

export function pick<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function shuffle<T>(rng: RNG, arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Base-36 random id fragment, Razorpay-style. */
export function randId(rng: RNG, prefix: string, len = 14): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(rng() * chars.length)];
  return `${prefix}_${out}`;
}
