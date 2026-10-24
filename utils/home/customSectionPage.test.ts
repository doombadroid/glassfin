import { customSectionPageLimit } from "./customSectionPage";

const PAGE_SIZE = 10;

/** The limits a row asks for, page after page, as the home row pages it. */
const pagesOfRow = (limit: number | undefined, available: number) => {
  const limits: number[] = [];
  let startIndex = 0;
  for (;;) {
    const pageLimit = customSectionPageLimit(startIndex, PAGE_SIZE, limit);
    const received = Math.min(pageLimit, Math.max(0, available - startIndex));
    limits.push(pageLimit);
    startIndex += received;
    // InfiniteScrollingCollectionList stops after a short page.
    if (received < PAGE_SIZE) return { limits, shown: startIndex };
  }
};

// Upstream #1290: a pinned collection with `limit: 40` kept paging past 40.
test("stops a row at the section's limit when the limit is above the page size", () => {
  expect(pagesOfRow(40, 100)).toEqual({
    limits: [10, 10, 10, 10, 0],
    shown: 40,
  });
});

test("asks for only what is left of the limit on the last page", () => {
  expect(pagesOfRow(15, 100)).toEqual({ limits: [10, 5], shown: 15 });
});

test("a limit below the page size is one short page", () => {
  expect(pagesOfRow(4, 100)).toEqual({ limits: [4], shown: 4 });
});

test("a section without a limit pages on to the end of the list", () => {
  expect(pagesOfRow(undefined, 25)).toEqual({
    limits: [10, 10, 10],
    shown: 25,
  });
});
