import { Ionicons } from "@expo/vector-icons";
import type {
  BaseItemDto,
  BaseItemKind,
  CollectionType,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type TouchableOpacityProps, View } from "react-native";
import { Image } from "@/components/common/ServerImage";
import { Text } from "@/components/common/Text";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";
import { LIBRARY_STRIP_HEIGHT } from "@/utils/library/libraryCardColumns";
import { TouchableItemRouter } from "../common/TouchableItemRouter";

interface Props extends TouchableOpacityProps {
  library: BaseItemDto;
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const icons: Record<CollectionType, IconName> = {
  movies: "film",
  tvshows: "tv",
  music: "musical-notes",
  books: "book",
  homevideos: "videocam",
  boxsets: "albums",
  playlists: "list",
  folders: "folder",
  livetv: "tv",
  musicvideos: "musical-notes",
  photos: "images",
  trailers: "videocam",
  unknown: "help-circle",
} as const;
export const LibraryItemCard: React.FC<Props> = ({ library, ...props }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const { settings } = useSettings();

  const { t } = useTranslation();

  const url = useMemo(
    () =>
      getPrimaryImageUrl({
        api,
        item: library,
      }),
    [api, library],
  );

  const itemType = useMemo(() => {
    let _itemType: BaseItemKind | undefined;

    if (library.CollectionType === "movies") {
      _itemType = "Movie";
    } else if (library.CollectionType === "tvshows") {
      _itemType = "Series";
    } else if (library.CollectionType === "boxsets") {
      _itemType = "BoxSet";
    } else if (library.CollectionType === "homevideos") {
      _itemType = "Video";
    } else if (library.CollectionType === "musicvideos") {
      _itemType = "MusicVideo";
    }

    return _itemType;
  }, [library.CollectionType]);

  const itemTypeName = useMemo(() => {
    let nameStr: string;

    if (library.CollectionType === "movies") {
      nameStr = t("library.item_types.movies");
    } else if (library.CollectionType === "tvshows") {
      nameStr = t("library.item_types.series");
    } else if (library.CollectionType === "boxsets") {
      nameStr = t("library.item_types.boxsets");
    } else {
      nameStr = t("library.item_types.items");
    }

    return nameStr;
  }, [library.CollectionType]);

  const { data: itemsCount } = useQuery({
    queryKey: ["library-count", library.Id],
    queryFn: async () => {
      if (!api) return null;
      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        parentId: library.Id,
        recursive: true,
        limit: 0,
        includeItemTypes: itemType ? [itemType] : undefined,
      });
      return response.data.TotalRecordCount;
    },
    // The card can mount before the api is restored.
    enabled: !!api,
  });

  if (!url) return null;

  if (settings?.libraryOptions?.display === "row") {
    return (
      <TouchableItemRouter item={library} className='w-full px-4'>
        <View className='flex flex-row items-center w-full relative '>
          <Ionicons
            name={icons[library.CollectionType!] || "folder"}
            size={22}
            color={"#e5e5e5"}
          />
          <Text className='text-start px-4 text-neutral-200'>
            {library.Name}
          </Text>
          {settings?.libraryOptions?.showStats && (
            <Text className='font-bold text-xs text-neutral-500 text-start ml-auto'>
              {itemsCount} {itemTypeName}
            </Text>
          )}
        </View>
      </TouchableItemRouter>
    );
  }

  const typeIcon = icons[library.CollectionType!] || "folder";
  const countLine =
    settings?.libraryOptions?.showStats && itemsCount != null
      ? `${itemsCount} ${itemTypeName}`
      : null;

  // Backdrop strip: the library's art fills a tall rounded strip, with the
  // name and count over a dark fade on the left and the type in a glass
  // badge. "Poster" keeps the art as a framed thumbnail on the right instead.
  if (settings?.libraryOptions?.imageStyle === "cover") {
    return (
      <TouchableItemRouter
        item={library}
        className='w-full'
        accessibilityLabel={
          countLine ? `${library.Name}, ${countLine}` : (library.Name ?? "")
        }
      >
        <View
          style={{ height: LIBRARY_STRIP_HEIGHT }}
          className='w-full rounded-[22px] overflow-hidden bg-neutral-900 justify-end'
        >
          <Image
            source={{ uri: url }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit='cover'
            cachePolicy={"memory-disk"}
          />
          <LinearGradient
            colors={["rgba(5,9,12,0.85)", "rgba(5,9,12,0.35)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          <View className='flex-row items-end justify-between px-4 pb-3.5'>
            <View className='shrink'>
              {settings?.libraryOptions?.showTitles && (
                <Text className='font-extrabold text-xl' numberOfLines={1}>
                  {library.Name}
                </Text>
              )}
              {countLine && (
                <Text className='text-xs text-neutral-200'>{countLine}</Text>
              )}
            </View>
            <TypeBadge icon={typeIcon} />
          </View>
        </View>
      </TouchableItemRouter>
    );
  }

  return (
    <TouchableItemRouter item={library} {...props}>
      <View
        style={{ height: LIBRARY_STRIP_HEIGHT }}
        className='flex flex-row items-center justify-between rounded-[22px] w-full border border-white/10 bg-white/5'
      >
        <View className='flex flex-col shrink pl-4'>
          <Text className='font-extrabold text-xl' numberOfLines={1}>
            {library.Name}
          </Text>
          {countLine && (
            <Text className='text-xs text-neutral-400'>{countLine}</Text>
          )}
        </View>
        <View className='p-2.5 h-full'>
          <Image
            source={{ uri: url }}
            className='h-full aspect-[2/1] object-cover rounded-2xl overflow-hidden'
          />
        </View>
      </View>
    </TouchableItemRouter>
  );
};

const TypeBadge: React.FC<{ icon: IconName }> = ({ icon }) => (
  <View
    className='w-9 h-9 rounded-full items-center justify-center border border-white/20'
    style={{ backgroundColor: "rgba(11,24,32,0.6)" }}
  >
    <Ionicons name={icon} size={16} color='#EEF3F6' />
  </View>
);
