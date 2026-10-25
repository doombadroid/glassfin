import { Ionicons } from "@expo/vector-icons";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi, getTvShowsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useSegments } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Image } from "@/components/common/ServerImage";
import { Text } from "@/components/common/Text";
import { getItemNavigation } from "@/components/common/TouchableItemRouter";
import { TwoPane } from "@/components/duo/TwoPane";
import { Colors } from "@/constants/Colors";
import { FrostColors } from "@/constants/Frost";
import useRouter from "@/hooks/useAppRouter";
import { usePlayMedia } from "@/hooks/usePlayMedia";
import { apiAtom, userAtom } from "@/utils/atoms/api";
import { useSettings } from "@/utils/atoms/settings";
import {
  minutesLeft,
  partOfDay,
  tonightItems,
  watchedFraction,
} from "@/utils/home/tonight";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { getParentBackdropImageUrl } from "@/utils/jellyfin/image/getParentBackdropImageUrl";
import { getPortraitImageUrl } from "@/utils/jellyfin/image/getPortraitImageUrl";
import { toImagePixels } from "@/utils/jellyfin/image/imagePixels";

/** Up next rows shown before "See all". */
const UP_NEXT_LIMIT = 6;
const RESUME_CARD_HEIGHT = 210;
const POSTER = { width: 52, height: 74 };
const RING = { size: 34, radius: 15, stroke: 3 };

const TEXT_MUTED = "#B5C0C8";

const PART_OF_DAY_KEYS = {
  morning: "home.tonight.part_of_day.morning",
  afternoon: "home.tonight.part_of_day.afternoon",
  evening: "home.tonight.part_of_day.evening",
  night: "home.tonight.part_of_day.night",
} as const;

/** "S1 E2 · 19 min left" for an episode, "Film · 1968 · 41 min left" otherwise. */
const useItemSubtitle = () => {
  const { t } = useTranslation();
  return (item: BaseItemDto) => {
    const parts =
      item.Type === "Episode"
        ? [
            t("home.tonight.episode_code", {
              season: item.ParentIndexNumber ?? 0,
              episode: item.IndexNumber ?? 0,
            }),
          ]
        : [
            t("home.tonight.film"),
            item.ProductionYear ? String(item.ProductionYear) : null,
          ];
    const left = minutesLeft(item);
    if (left !== null)
      parts.push(t("home.tonight.minutes_left", { count: left }));
    return parts.filter(Boolean).join(" · ");
  };
};

const itemTitle = (item: BaseItemDto) =>
  item.Type === "Episode" ? (item.SeriesName ?? item.Name) : item.Name;

/** "Saturday evening" over the "Tonight" title. */
export const TonightHeader = () => {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const weekday = new Intl.DateTimeFormat(i18n.language, {
    weekday: "long",
  }).format(now);
  return (
    <View className='px-4 mb-3'>
      <Text style={{ color: TEXT_MUTED }} className='text-sm'>
        {t(PART_OF_DAY_KEYS[partOfDay(now.getHours())], { weekday })}
      </Text>
      <Text className='text-3xl font-extrabold' accessibilityRole='header'>
        {t("home.tonight.title")}
      </Text>
    </View>
  );
};

const useOpenItem = () => {
  const router = useRouter();
  const segments = useSegments();
  const from = (segments as string[])[2] || "(home)";
  return (item: BaseItemDto) =>
    router.push(getItemNavigation(item, from) as any);
};

const ResumeCard = ({ item }: { item: BaseItemDto }) => {
  const { t } = useTranslation();
  const api = useAtomValue(apiAtom);
  const playMedia = usePlayMedia();
  const openItem = useOpenItem();
  const subtitle = useItemSubtitle();
  const width = toImagePixels(600);
  const uri =
    item.Type === "Episode"
      ? getParentBackdropImageUrl({ api, item, quality: 80, width })
      : getBackdropUrl({ api, item, quality: 80, width });
  const title = itemTitle(item);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => openItem(item)}
      accessibilityRole='button'
      accessibilityLabel={title ?? undefined}
      style={styles.card}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit='cover'
        />
      ) : null}
      <View style={styles.cardBar}>
        <TouchableOpacity
          onPress={() =>
            item.Id && playMedia({ itemId: item.Id, offline: false }, { item })
          }
          accessibilityRole='button'
          accessibilityLabel={t("home.tonight.resume", { title })}
          style={styles.playButton}
        >
          <Ionicons name='play' size={18} color={Colors.onPrimary} />
        </TouchableOpacity>
        <View className='flex-1'>
          <Text className='text-base font-bold' numberOfLines={1}>
            {title}
          </Text>
          <Text className='text-xs' style={{ color: "#C9D2D8" }}>
            {subtitle(item)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProgressRing = ({ fraction }: { fraction: number }) => {
  const circumference = 2 * Math.PI * RING.radius;
  const centre = RING.size / 2;
  return (
    <Svg width={RING.size} height={RING.size} accessible={false}>
      <Circle
        cx={centre}
        cy={centre}
        r={RING.radius}
        fill='none'
        stroke='rgba(255,255,255,0.15)'
        strokeWidth={RING.stroke}
      />
      {fraction > 0 ? (
        <Circle
          cx={centre}
          cy={centre}
          r={RING.radius}
          fill='none'
          stroke={Colors.primary}
          strokeWidth={RING.stroke}
          strokeLinecap='round'
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          transform={`rotate(-90 ${centre} ${centre})`}
        />
      ) : null}
    </Svg>
  );
};

const UpNextRow = ({ item }: { item: BaseItemDto }) => {
  const { t } = useTranslation();
  const api = useAtomValue(apiAtom);
  const openItem = useOpenItem();
  const subtitle = useItemSubtitle();
  const uri = getPortraitImageUrl({
    api,
    item,
    width: toImagePixels(POSTER.width),
  });
  const fraction = watchedFraction(item);
  const title = itemTitle(item);

  return (
    <TouchableOpacity
      onPress={() => openItem(item)}
      accessibilityRole='button'
      accessibilityLabel={`${title}, ${subtitle(item)}, ${t(
        "home.tonight.percent_watched",
        { percent: Math.round(fraction * 100) },
      )}`}
      className='flex-row items-center py-1.5'
      style={{ gap: 12, minHeight: 44 }}
    >
      <View style={styles.poster}>
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit='cover'
          />
        ) : null}
      </View>
      <View className='flex-1'>
        <Text className='text-sm font-semibold' numberOfLines={1}>
          {title}
        </Text>
        <Text className='text-xs' style={{ color: TEXT_MUTED }}>
          {subtitle(item)}
        </Text>
      </View>
      <ProgressRing fraction={fraction} />
    </TouchableOpacity>
  );
};

/**
 * The top of Home: one big card to resume the most recent item, then the
 * rest of continue watching and next up as a list. Side by side when the
 * window is wide (the unfolded iPhone Duo, held like a book across the fold).
 */
export const TonightFeed = ({ onLoaded }: { onLoaded?: () => void }) => {
  const { t } = useTranslation();
  const api = useAtomValue(apiAtom);
  const user = useAtomValue(userAtom);
  const { settings } = useSettings();
  const merge = settings.mergeNextUpAndContinueWatching;
  const [expanded, setExpanded] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["home", "tonight", user?.Id, merge],
    queryFn: async () => {
      if (!api || !user?.Id) return [];
      const [resume, nextUp] = await Promise.all([
        getItemsApi(api).getResumeItems({
          userId: user.Id,
          enableImageTypes: ["Primary", "Backdrop", "Thumb"],
          includeItemTypes: ["Movie", "Episode"],
          limit: 20,
        }),
        getTvShowsApi(api).getNextUp({
          userId: user.Id,
          limit: 20,
          enableImageTypes: ["Primary", "Backdrop", "Thumb"],
          enableResumable: false,
        }),
      ]);
      return tonightItems(
        resume.data.Items ?? [],
        nextUp.data.Items ?? [],
        !!merge,
      );
    },
    enabled: !!api && !!user?.Id,
  });

  // Home holds back its other rows until this one has answered, either way.
  useEffect(() => {
    if (!isLoading) onLoaded?.();
  }, [isLoading, onLoaded]);

  // The "hero" switch in Appearance now governs the resume card.
  const showCard = settings.showHeroCarousel !== false;
  const [first, ...others] = items ?? [];
  const rest = showCard ? others : (items ?? []);
  const shown = expanded ? rest : rest.slice(0, UP_NEXT_LIMIT);

  return (
    <View>
      <TonightHeader />
      {first ? (
        <View className='px-4'>
          <TwoPane
            primary={
              showCard ? (
                <View className='mb-4'>
                  <ResumeCard item={first} />
                </View>
              ) : null
            }
            secondary={
              rest.length > 0 ? (
                <View>
                  <Text
                    className='text-xs font-bold mb-1'
                    style={{ color: TEXT_MUTED, letterSpacing: 1 }}
                  >
                    {t("home.tonight.up_next").toUpperCase()}
                  </Text>
                  {shown.map((item) => (
                    <UpNextRow key={item.Id} item={item} />
                  ))}
                  {rest.length > UP_NEXT_LIMIT ? (
                    <TouchableOpacity
                      onPress={() => setExpanded((v) => !v)}
                      accessibilityRole='button'
                      style={{ minHeight: 44, justifyContent: "center" }}
                    >
                      <Text
                        className='text-sm font-semibold'
                        style={{ color: Colors.primary }}
                      >
                        {expanded
                          ? t("home.tonight.show_less")
                          : t("home.tonight.see_all", { count: rest.length })}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null
            }
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: RESUME_CARD_HEIGHT,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#22404F",
    justifyContent: "flex-end",
  },
  cardBar: {
    margin: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(11, 24, 32, 0.6)",
    borderWidth: 1,
    borderColor: FrostColors.glassEdge,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  poster: {
    width: POSTER.width,
    height: POSTER.height,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: FrostColors.glassRaised,
  },
});
