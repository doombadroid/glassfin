import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import type { QueryClient } from "@tanstack/react-query";

/**
 * An episode as a season list already in the cache holds it, or undefined.
 *
 * The item page swaps the episode it shows in place when one is picked from
 * its season carousel. An episode the page had not fetched yet had no data, so
 * the page unmounted its content for the skeleton and the carousel came back
 * scrolled to the start (upstream #1393). The carousel's own list has the
 * episode, with fewer fields, which the page shows until the full one lands.
 */
export const cachedSeasonEpisode = (
  queryClient: QueryClient,
  id: string | undefined,
): BaseItemDto | undefined => {
  if (!id) return undefined;

  for (const [, episodes] of queryClient.getQueriesData<unknown>({
    queryKey: ["episodes"],
  })) {
    if (!Array.isArray(episodes)) continue;
    const episode = (episodes as (BaseItemDto | null | undefined)[]).find(
      (e) => e?.Id === id,
    );
    if (episode) return episode;
  }
  return undefined;
};
