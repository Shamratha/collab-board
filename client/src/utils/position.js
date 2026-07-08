// Mirrors the server's fractional ordering: a card dropped between two others
// takes the midpoint of their positions. Open ends step by a fixed amount.
const STEP = 1000;

// Compute the position for a card that now sits between `prev` and `next`
// (either may be undefined at the ends of a list).
export function positionBetween(prev, next) {
  const before = prev?.position;
  const after = next?.position;
  if (before == null && after == null) return STEP;
  if (before == null) return after - STEP;
  if (after == null) return before + STEP;
  return (before + after) / 2;
}
