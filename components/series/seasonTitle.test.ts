import { seasonTitle } from "@/components/series/seasonTitle";

describe("seasonTitle", () => {
  test("keeps a season's own name", () => {
    expect(
      seasonTitle(
        { Name: "Specials", IndexNumber: 0, SeriesName: "Cat" },
        "Season",
      ),
    ).toBe("Specials");
  });

  test("a name that repeats the show's becomes Season N", () => {
    expect(
      seasonTitle(
        {
          Name: "Chainsmoker Cat",
          IndexNumber: 1,
          SeriesName: "Chainsmoker Cat",
        },
        "Season",
      ),
    ).toBe("Season 1");
  });

  test("a missing name becomes Season N", () => {
    expect(seasonTitle({ IndexNumber: 101 }, "Season")).toBe("Season 101");
  });
});
