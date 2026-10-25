import { Ionicons } from "@expo/vector-icons";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { Text } from "@/components/common/Text";
import { getItemNavigation } from "@/components/common/TouchableItemRouter";
import { Colors } from "@/constants/Colors";
import useRouter from "@/hooks/useAppRouter";
import { getSeriesPlaybackTarget } from "@/utils/seriesPlaybackTarget";

/**
 * The sheet's mint button on a series: opens the episode a series-level Play
 * means (the resumable one, else the next unwatched), where Play takes over.
 */
export const SeriesContinueButton: React.FC<{
  episodes: readonly BaseItemDto[] | undefined;
}> = ({ episodes }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const target = getSeriesPlaybackTarget(episodes ?? []);
  if (!target) return null;

  const resuming =
    !target.UserData?.Played &&
    (target.UserData?.PlaybackPositionTicks ?? 0) > 0;
  const label = t(
    resuming ? "item.glass.resume_episode" : "item.glass.play_episode",
    {
      season: target.ParentIndexNumber ?? 0,
      episode: target.IndexNumber ?? 0,
    },
  );

  return (
    <TouchableOpacity
      accessibilityRole='button'
      accessibilityLabel={label}
      onPress={() => router.push(getItemNavigation(target, "") as any)}
      className='mx-4 mb-4 rounded-full flex flex-row items-center justify-center'
      style={{ minHeight: 50, backgroundColor: Colors.primary }}
    >
      <Ionicons name='play' size={16} color={Colors.onPrimary} />
      <Text className='ml-2 font-bold' style={{ color: Colors.onPrimary }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
