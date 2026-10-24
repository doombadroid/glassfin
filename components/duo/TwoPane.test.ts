import { twoPaneSplit } from "./TwoPane";

describe("twoPaneSplit", () => {
  it("stacks on a phone-width window", () => {
    expect(twoPaneSplit({ x: 0, width: 402 }, null)).toBeNull();
  });

  it("splits by share when flat", () => {
    expect(twoPaneSplit({ x: 0, width: 1000 }, null)).toEqual({
      primaryWidth: 448,
      gap: 24,
    });
  });

  it("puts the gap over the fold, with a margin each side", () => {
    // Content starts 200pt in (sidebar); fold at 455–496 in the window.
    expect(twoPaneSplit({ x: 200, width: 700 }, { x: 455, width: 41 })).toEqual(
      { primaryWidth: 243, gap: 65 },
    );
  });

  it("ignores a fold outside the box", () => {
    expect(twoPaneSplit({ x: 500, width: 700 }, { x: 455, width: 41 })).toEqual(
      { primaryWidth: 310, gap: 24 },
    );
  });
});
