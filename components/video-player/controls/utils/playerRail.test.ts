import { playerRailEdge } from "./playerRail";

describe("playerRailEdge", () => {
  it("keeps the row when the sides match (no strip, or a notch on both)", () => {
    expect(playerRailEdge({ left: 0, right: 0 })).toBeNull();
    expect(playerRailEdge({ left: 59, right: 59 })).toBeNull();
  });

  it("ignores small differences", () => {
    expect(playerRailEdge({ left: 0, right: 12 })).toBeNull();
  });

  it("follows the edge with the strip", () => {
    expect(playerRailEdge({ left: 0, right: 64 })).toBe("right");
    expect(playerRailEdge({ left: 64, right: 8 })).toBe("left");
  });
});
