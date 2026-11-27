// Gobble & Go — a tiny seeded random generator (mulberry32) so the
// screenshot scenes (?shot=...&seed=N) play out the same way every time.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Read ?seed= from the page URL; fall back to a fresh random seed.
export function seedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = Number.parseInt(params.get('seed') ?? '', 10);
  if (Number.isFinite(raw)) return raw >>> 0;
  return (Math.random() * 0xffffffff) >>> 0;
}

// Pick one item from a list with the seeded generator.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// A number in [min, max) from the seeded generator.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Roll a chance in [0, 1): true with probability p.
export function chance(rng, p) {
  return rng() < p;
}
