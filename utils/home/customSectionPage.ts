/**
 * How many items a page of a plugin home section asks for, starting at
 * `startIndex`.
 *
 * The section's `limit` is how many items its row shows in all, while the row
 * pages through them `pageSize` at a time. It used to go out as the size of
 * every page: a limit above the page size filled the first page past it, so
 * the row asked for another page, and another, and never stopped at the limit
 * (upstream #1290). A section without a limit pages on to the end.
 *
 * @returns The request's `limit`, 0 once the row has reached the section's.
 */
export const customSectionPageLimit = (
  startIndex: number,
  pageSize: number,
  limit?: number,
): number =>
  limit ? Math.max(0, Math.min(pageSize, limit - startIndex)) : pageSize;
