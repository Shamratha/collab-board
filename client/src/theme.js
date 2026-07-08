// Each list/column gets a colour from this rotation, so a board reads as a set
// of distinct, hand-picked columns rather than a wall of identical grey boxes.
export const LIST_COLORS = [
  '#e4572e', // coral
  '#2a9d8f', // teal
  '#e0a100', // mustard
  '#5b6ee1', // periwinkle
  '#b5497f', // magenta
  '#3d9970', // green
];

export function listColor(index) {
  return LIST_COLORS[index % LIST_COLORS.length];
}
