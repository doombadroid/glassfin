import { QueryClient } from "@tanstack/react-query";
import { cachedSeasonEpisode } from "./cachedSeasonEpisode";

const episode = (id: string) => ({ Id: id, Type: "Episode" as const });

const clientWith = (entries: [unknown[], unknown][]) => {
  const queryClient = new QueryClient();
  for (const [queryKey, data] of entries) {
    queryClient.setQueryData(queryKey, data);
  }
  return queryClient;
};

// Upstream #1393: an episode picked in the season carousel that the page had
// not fetched yet had nothing to show, so the page dropped to its skeleton.
test("finds an episode the season carousel has listed", () => {
  const queryClient = clientWith([
    [
      ["episodes", "season-1", false],
      [episode("e1"), episode("e2")],
    ],
  ]);

  expect(cachedSeasonEpisode(queryClient, "e2")).toEqual(episode("e2"));
});

test("looks through every season list, the offline ones included", () => {
  const queryClient = clientWith([
    [["episodes", "season-1", false], [episode("e1")]],
    [["episodes", "season-2", true], [episode("e9")]],
  ]);

  expect(cachedSeasonEpisode(queryClient, "e9")).toEqual(episode("e9"));
});

test("has nothing for an episode no list holds", () => {
  const queryClient = clientWith([
    [["episodes", "season-1", false], [episode("e1")]],
  ]);

  expect(cachedSeasonEpisode(queryClient, "e5")).toBeUndefined();
  expect(cachedSeasonEpisode(queryClient, undefined)).toBeUndefined();
});

test("skips an episodes entry that is not a list", () => {
  const queryClient = clientWith([
    [["episodes", "season-1"], null],
    [["episodes", "other"], { Items: [episode("e1")] }],
  ]);

  expect(cachedSeasonEpisode(queryClient, "e1")).toBeUndefined();
});

test("never reads a query outside the episode lists", () => {
  const queryClient = clientWith([[["item", "e1"], [episode("e1")]]]);

  expect(cachedSeasonEpisode(queryClient, "e1")).toBeUndefined();
});
