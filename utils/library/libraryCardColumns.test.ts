import { libraryCardColumns } from "./libraryCardColumns";

// The library list pads its content by 17pt on each side.
const content = (windowWidth: number) => windowWidth - 34;

describe("libraryCardColumns", () => {
  test("keeps one column on every phone width, the folded iPhone Duo included", () => {
    for (const width of [320, 375, 402, 440, 466]) {
      expect(libraryCardColumns(content(width))).toBe(1);
    }
  });

  // Upstream #1997: one full width card on an iPad cropped the artwork to a strip.
  test("splits a wide window into columns", () => {
    expect(libraryCardColumns(content(669))).toBe(2);
    expect(libraryCardColumns(content(1180))).toBe(3);
  });

  test("never returns zero columns", () => {
    expect(libraryCardColumns(0)).toBe(1);
  });
});
