import { Ionicons } from "@expo/vector-icons";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { t } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { seasonTitle } from "@/components/series/seasonTitle";
import { FrostColors } from "@/constants/Frost";
import { Text } from "../common/Text";
import { PlatformDropdown } from "../PlatformDropdown";

type Props = {
  item: BaseItemDto;
  seasons: BaseItemDto[];
  initialSeasonIndex?: number;
  state: SeasonIndexState;
  onSelect: (season: BaseItemDto) => void;
};

type SeasonKeys = {
  id: keyof BaseItemDto;
  title: keyof BaseItemDto;
  index: keyof BaseItemDto;
};

export type SeasonIndexState = {
  [seriesId: string]: number | string | null | undefined;
};

export const SeasonDropdown: React.FC<Props> = ({
  item,
  seasons,
  initialSeasonIndex,
  state,
  onSelect,
}) => {
  const isTv = Platform.isTV;
  const [open, setOpen] = useState(false);

  const keys = useMemo<SeasonKeys>(
    () =>
      item.Type === "Episode"
        ? {
            id: "ParentId",
            title: "SeasonName",
            index: "ParentIndexNumber",
          }
        : {
            id: "Id",
            title: "Name",
            index: "IndexNumber",
          },
    [item],
  );

  const seasonIndex = useMemo(
    () => state[(item[keys.id] as string) ?? ""],
    [state, item, keys],
  );

  // Always use IndexNumber for Season objects (not keys.index which is for the item)
  const sortByIndex = (a: BaseItemDto, b: BaseItemDto) =>
    Number(a.IndexNumber) - Number(b.IndexNumber);

  const optionGroups = useMemo(
    () => [
      {
        options:
          [...(seasons ?? [])].sort(sortByIndex).map((season: any) => {
            const title = seasonTitle(season, t("item_card.season"));
            return {
              type: "radio" as const,
              label: title,
              value: season.Id || season.IndexNumber,
              // Compare season's IndexNumber with the selected seasonIndex
              selected: Number(season.IndexNumber) === Number(seasonIndex),
              onPress: () => onSelect(season),
            };
          }) || [],
      },
    ],
    [seasons, seasonIndex, onSelect],
  );

  useEffect(() => {
    if (isTv) return;
    if (seasons && seasons.length > 0 && seasonIndex === undefined) {
      let initialIndex: number | undefined;

      if (initialSeasonIndex !== undefined) {
        // Use the provided initialSeasonIndex if it exists in the seasons
        const seasonExists = seasons.some(
          (season: any) => season[keys.index] === initialSeasonIndex,
        );
        if (seasonExists) {
          initialIndex = initialSeasonIndex;
        }
      }

      if (initialIndex === undefined) {
        // Fall back to the previous logic if initialIndex is not set
        const season1 = seasons.find((season: any) => season[keys.index] === 1);
        const season0 = seasons.find((season: any) => season[keys.index] === 0);
        const firstSeason = season1 || season0 || seasons[0];
        onSelect(firstSeason);
      }

      if (initialIndex !== undefined) {
        const initialSeason = seasons.find(
          (season: any) => season[keys.index] === initialIndex,
        );
        if (initialSeason) onSelect(initialSeason!);
        else throw Error("Initial index could not be found!");
      }
    }
  }, [
    isTv,
    seasons,
    seasonIndex,
    item,
    item[keys.id],
    initialSeasonIndex,
    keys,
  ]);

  if (isTv) return null;

  // The season's own name ("Specials", "Season 101"), not just its number.
  const selected = seasons?.find(
    (season) => Number(season.IndexNumber) === Number(seasonIndex),
  );
  const label = selected
    ? seasonTitle(selected, t("item_card.season"))
    : seasonIndex == null
      ? ""
      : `${t("item_card.season")} ${seasonIndex}`;

  return (
    <PlatformDropdown
      groups={optionGroups}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <TouchableOpacity
          onPress={() => setOpen(true)}
          accessibilityRole='button'
          accessibilityLabel={t("item.glass.choose_season", { season: label })}
        >
          <View
            className='rounded-full px-4 flex flex-row items-center'
            style={{
              minHeight: 40,
              backgroundColor: FrostColors.glassRaised,
              borderWidth: 1,
              borderColor: FrostColors.glassEdge,
            }}
          >
            <Text className='font-bold mr-2'>{label}</Text>
            <Ionicons name='chevron-down' size={16} color='white' />
          </View>
        </TouchableOpacity>
      }
      title={t("item_card.seasons")}
    />
  );
};
