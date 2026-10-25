import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export type PartOfDay = "morning" | "afternoon" | "evening" | "night";

/** The Tonight header's "Saturday evening": which part of the day an hour is. */
export const partOfDay = (hour: number): PartOfDay => {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
};

const lastActivity = (item: BaseItemDto) =>
  new Date(item.UserData?.LastPlayedDate || item.DateCreated || 0).getTime();

/**
 * The Tonight feed's items: continue watching and next up in one list, each
 * item, and each show, once. With the merge setting on, by most recent activity, as the
 * merged row sorted them; off, continue watching first, then next up.
 */
export const tonightItems = (
  resume: BaseItemDto[],
  nextUp: BaseItemDto[],
  mergeByActivity: boolean,
): BaseItemDto[] => {
  const combined = [...resume, ...nextUp];
  const ordered = mergeByActivity
    ? combined.sort((a, b) => lastActivity(b) - lastActivity(a))
    : combined;
  // One entry per show: several half-watched episodes of one series would
  // otherwise fill the list. The first (most relevant) episode wins.
  const seen = new Set<string>();
  return ordered.filter((item) => {
    const key = item.SeriesId ?? item.Id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const TICKS_PER_MINUTE = 600_000_000;

/** Whole minutes left of a started item, at least 1; null when not started. */
export const minutesLeft = (item: BaseItemDto): number | null => {
  const runtime = item.RunTimeTicks;
  const position = item.UserData?.PlaybackPositionTicks;
  if (!runtime || !position) return null;
  return Math.max(1, Math.round((runtime - position) / TICKS_PER_MINUTE));
};

/** How much of the item has been watched, 0 to 1. */
export const watchedFraction = (item: BaseItemDto): number => {
  if (item.UserData?.Played) return 1;
  const percent = item.UserData?.PlayedPercentage ?? 0;
  return Math.min(1, Math.max(0, percent / 100));
};
