import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import type { TFunction } from "i18next";
import { getItemProgressPercentage } from "@/components/common/ProgressBar";
import { runtimeTicksToMinutes } from "@/utils/time";

const TICKS_PER_MINUTE = 600_000_000;

/** "2. The Man From Mars": the season list already says which season. */
export const episodeRowTitle = (episode: BaseItemDto): string =>
  episode.IndexNumber != null
    ? `${episode.IndexNumber}. ${episode.Name ?? ""}`
    : (episode.Name ?? "");

/** Time left for an episode in progress, else its runtime. */
export const episodeRowDetail = (
  episode: BaseItemDto,
  t: TFunction,
): string | null => {
  const runtime = episode.RunTimeTicks;
  const position = episode.UserData?.PlaybackPositionTicks ?? 0;
  if (
    runtime &&
    position > 0 &&
    position < runtime &&
    !episode.UserData?.Played
  ) {
    const count = Math.max(
      1,
      Math.round((runtime - position) / TICKS_PER_MINUTE),
    );
    return t("item.glass.minutes_left", { count });
  }
  return runtime ? runtimeTicksToMinutes(runtime) : null;
};

/** Watched fraction for the ring: a played episode is full. */
export const episodeRowProgress = (episode: BaseItemDto): number =>
  episode.UserData?.Played ? 1 : getItemProgressPercentage(episode) / 100;
