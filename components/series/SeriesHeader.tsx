import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "../common/Text";
import { ItemCredits } from "../item/ItemCredits";
import { Ratings } from "../Ratings";
import { ItemActions } from "./SeriesActions";

interface Props {
  item: BaseItemDto;
}

export const SeriesHeader = ({ item }: Props) => {
  const { t } = useTranslation();
  const startYear = useMemo(() => {
    if (item?.StartDate) {
      return new Date(item.StartDate)
        .toLocaleDateString("sv-SE", {
          calendar: "gregory",
          year: "numeric",
        })
        .toString()
        .trim();
    }
    return item.ProductionYear?.toString().trim();
  }, [item]);

  const endYear = useMemo(() => {
    if (item.EndDate) {
      return new Date(item.EndDate)
        .toLocaleDateString("sv-SE", {
          calendar: "gregory",
          year: "numeric",
        })
        .toString()
        .trim();
    }
    return "";
  }, [item]);

  const yearString = useMemo(() => {
    if (startYear && endYear) {
      if (startYear === endYear) return startYear;
      return `${startYear} - ${endYear}`;
    }
    if (startYear) {
      return startYear;
    }
    if (endYear) {
      return endYear;
    }
    return "";
  }, [startYear, endYear]);

  // One meta line: the years, the first genres and how many seasons.
  const meta = [
    yearString,
    item.Genres?.slice(0, 2).join(", "),
    item.ChildCount === 1
      ? t("item.glass.one_season")
      : item.ChildCount
        ? t("item.glass.season_count", { count: item.ChildCount })
        : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View className='px-4 pt-2 pb-4'>
      <Text className='text-3xl font-bold' style={{ lineHeight: 38 }}>
        {item?.Name}
      </Text>
      {Boolean(meta) && (
        // An explicit line height: without one the descenders spill past the
        // text's box, and whatever follows is laid out against the box.
        <Text
          className='text-neutral-400'
          style={{ lineHeight: 20, marginBottom: 16 }}
        >
          {meta}
        </Text>
      )}
      {/* Top-aligned: the actions are taller than the badges, and centring
          them pulled the badge row up towards the year. */}
      <View className='flex flex-row items-start justify-between mb-2'>
        <Ratings item={item} className='flex-1 mr-2' />
        <ItemActions item={item} />
      </View>
      <Text>{item?.Overview}</Text>
      <ItemCredits people={item.People} className='mt-4' />
    </View>
  );
};
