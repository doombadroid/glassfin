import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  minutesLeft,
  partOfDay,
  tonightItems,
  watchedFraction,
} from "@/utils/home/tonight";

const item = (Id: string, lastPlayed?: string): BaseItemDto => ({
  Id,
  UserData: lastPlayed ? { LastPlayedDate: lastPlayed } : {},
});

describe("partOfDay", () => {
  test("splits the day at 5, 12, 17 and 22", () => {
    expect([0, 4, 5, 11, 12, 16, 17, 21, 22, 23].map(partOfDay)).toEqual([
      "night",
      "night",
      "morning",
      "morning",
      "afternoon",
      "afternoon",
      "evening",
      "evening",
      "night",
      "night",
    ]);
  });
});

describe("tonightItems", () => {
  const resume = [item("a", "2026-10-20"), item("b", "2026-10-24")];
  const nextUp = [item("c", "2026-10-22"), item("a", "2026-10-20")];

  test("merged: most recent activity first, each item once", () => {
    expect(tonightItems(resume, nextUp, true).map((i) => i.Id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  test("not merged: continue watching first, then next up", () => {
    expect(tonightItems(resume, nextUp, false).map((i) => i.Id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("one entry per show: the first episode of a series wins", () => {
    const episode = (Id: string, SeriesId: string): BaseItemDto => ({
      Id,
      SeriesId,
      UserData: {},
    });
    const items = tonightItems(
      [episode("e10", "cat"), episode("e7", "cat"), item("film")],
      [episode("e4", "cat"), episode("s2", "other")],
      false,
    );
    expect(items.map((i) => i.Id)).toEqual(["e10", "film", "s2"]);
  });

  test("leaves the caller's arrays alone", () => {
    const input = [item("x", "2026-01-01"), item("y", "2026-02-01")];
    tonightItems(input, [], true);
    expect(input.map((i) => i.Id)).toEqual(["x", "y"]);
  });
});

describe("minutesLeft", () => {
  test("null until started, then rounded and never 0", () => {
    expect(minutesLeft({ RunTimeTicks: 36_000_000_000 })).toBeNull();
    expect(
      minutesLeft({
        RunTimeTicks: 36_000_000_000,
        UserData: { PlaybackPositionTicks: 24_600_000_000 },
      }),
    ).toBe(19);
    expect(
      minutesLeft({
        RunTimeTicks: 36_000_000_000,
        UserData: { PlaybackPositionTicks: 35_999_000_000 },
      }),
    ).toBe(1);
  });
});

describe("watchedFraction", () => {
  test("played is full, otherwise the clamped percentage", () => {
    expect(watchedFraction({ UserData: { Played: true } })).toBe(1);
    expect(watchedFraction({ UserData: { PlayedPercentage: 38 } })).toBe(0.38);
    expect(watchedFraction({ UserData: { PlayedPercentage: 140 } })).toBe(1);
    expect(watchedFraction({})).toBe(0);
  });
});
