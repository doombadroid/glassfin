import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
/**
 * A season's own name ("Specials"), unless it is missing or just repeats the
 * show's name, which some servers store for single-season shows: then
 * "Season N".
 */
export const seasonTitle = (season: BaseItemDto, seasonWord: string) => {
  const name = season.Name?.trim();
  if (name && name !== season.SeriesName?.trim()) return name;
  return `${seasonWord} ${season.IndexNumber ?? ""}`.trim();
};
