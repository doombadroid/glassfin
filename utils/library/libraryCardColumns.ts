/**
 * Narrowest a library card may get before the grid adds a column. A card is a
 * fixed 80pt tall banner, so one card across a wide window crops the library
 * artwork to a thin strip (upstream #1997).
 */
export const LIBRARY_CARD_MIN_WIDTH = 300;

/** Columns of library cards that fit in `contentWidth` points. */
export const libraryCardColumns = (contentWidth: number): number =>
  Math.max(1, Math.floor(contentWidth / LIBRARY_CARD_MIN_WIDTH));
