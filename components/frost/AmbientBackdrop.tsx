import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { StyleSheet, View } from "react-native";
import { Image } from "@/components/common/ServerImage";
import { FrostAmbient, FrostColors } from "@/constants/Frost";
import { apiAtom, userAtom } from "@/utils/atoms/api";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";

/**
 * The Frost ambient layer: the item's backdrop, heavily blurred and darkened,
 * filling the screen behind transparent content. Without an item it is the
 * plain ground colour.
 */
export const AmbientBackdrop = ({ item }: { item?: BaseItemDto | null }) => {
  const api = useAtomValue(apiAtom);
  const uri = getBackdropUrl({
    api,
    item,
    quality: 60,
    width: FrostAmbient.imageWidth,
  });

  return (
    <View
      pointerEvents='none'
      style={[StyleSheet.absoluteFill, { backgroundColor: FrostColors.ground }]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit='cover'
          blurRadius={FrostAmbient.blurRadius}
          transition={FrostAmbient.transitionMs}
          cachePolicy='memory-disk'
        />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: FrostColors.scrim },
        ]}
      />
    </View>
  );
};

/** Home's ambient layer follows the first item in Continue Watching. */
export const HomeAmbientBackdrop = () => {
  const api = useAtomValue(apiAtom);
  const user = useAtomValue(userAtom);
  const { data } = useQuery({
    queryKey: ["frost", "ambient", "resume", user?.Id],
    queryFn: async () =>
      (
        await getItemsApi(api!).getResumeItems({
          userId: user!.Id!,
          enableImageTypes: ["Backdrop", "Primary"],
          includeItemTypes: ["Movie", "Episode"],
          limit: 1,
        })
      ).data.Items?.[0] ?? null,
    enabled: !!api && !!user?.Id,
    staleTime: 60_000,
  });

  return <AmbientBackdrop item={data} />;
};
