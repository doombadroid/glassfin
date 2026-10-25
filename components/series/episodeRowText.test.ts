import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import type { TFunction } from "i18next";
import {
  episodeRowDetail,
  episodeRowProgress,
  episodeRowTitle,
} from "./episodeRowText";

const t = ((key: string, opts?: { count?: number }) =>
  `${key}:${opts?.count}`) as unknown as TFunction;
const MINUTE = 600_000_000;

test("numbers the title when the episode has an index", () => {
  expect(episodeRowTitle({ IndexNumber: 2, Name: "Mars" })).toBe("2. Mars");
  expect(episodeRowTitle({ Name: "Special" })).toBe("Special");
});

test("an episode in progress shows the time left, rounded to a minute", () => {
  const episode: BaseItemDto = {
    RunTimeTicks: 45 * MINUTE,
    UserData: { PlaybackPositionTicks: 26 * MINUTE },
  };
  expect(episodeRowDetail(episode, t)).toBe("item.glass.minutes_left:19");
});

test("a played or unstarted episode shows its runtime", () => {
  const runtime = 45 * MINUTE;
  expect(episodeRowDetail({ RunTimeTicks: runtime }, t)).toBe("45m");
  expect(
    episodeRowDetail(
      {
        RunTimeTicks: runtime,
        UserData: { Played: true, PlaybackPositionTicks: 10 * MINUTE },
      },
      t,
    ),
  ).toBe("45m");
  expect(episodeRowDetail({}, t)).toBeNull();
});

test("a played episode fills the ring", () => {
  expect(episodeRowProgress({ UserData: { Played: true } })).toBe(1);
  expect(episodeRowProgress({})).toBe(0);
});
