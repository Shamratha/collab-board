// Fractional ordering helpers. Items carry a float `position`; inserting between
// two items uses the midpoint of their positions, so a move touches only the
// moved row. New items append at the end via a fixed step.

export const POSITION_STEP = 1000;

// Position for a new item appended after the current max (or the first item).
export function appendPosition(maxPosition) {
  if (maxPosition === null || maxPosition === undefined) return POSITION_STEP;
  return maxPosition + POSITION_STEP;
}

// Position that places an item between `before` and `after`.
// Pass null for an open end (start or end of the list).
export function between(before, after) {
  if (before == null && after == null) return POSITION_STEP;
  if (before == null) return after - POSITION_STEP;
  if (after == null) return before + POSITION_STEP;
  return (before + after) / 2;
}
