import {
  getUserLibraryApi,
  getUserViewsApi,
} from "@jellyfin/sdk/lib/utils/api";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Loader } from "@/components/Loader";
import { LibraryItemCard } from "@/components/library/LibraryItemCard";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { libraryCardColumns } from "@/utils/library/libraryCardColumns";

export const Libraries: React.FC = () => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["user-views", user?.Id],
    queryFn: async () => {
      const response = await getUserViewsApi(api!).getUserViews({
        userId: user?.Id,
      });

      return response.data.Items || null;
    },
    staleTime: 60,
    // On logout the cached query refetches with api null and crashes inside
    // the SDK (`configuration` of null).
    enabled: !!api && !!user?.Id,
  });

  const libraries = useMemo(
    () =>
      data
        ?.filter((l) => !settings?.hiddenLibraries?.includes(l.Id!))
        .filter((l) => l.CollectionType !== "books") || [],
    [data, settings?.hiddenLibraries],
  );

  useEffect(() => {
    for (const item of data || []) {
      queryClient.prefetchQuery({
        queryKey: ["library", item.Id],
        queryFn: async () => {
          if (!item.Id || !user?.Id || !api) return null;
          const response = await getUserLibraryApi(api).getItem({
            itemId: item.Id,
            userId: user?.Id,
          });
          return response.data;
        },
        staleTime: 60 * 1000,
      });
    }
  }, [data, api, queryClient, user?.Id]);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isRow = settings?.libraryOptions?.display === "row";
  const columns = isRow
    ? 1
    : libraryCardColumns(width - insets.left - insets.right - 34);
  // Half the gap between two columns, taken back from the side padding so the
  // outer cards still line up with the rest of the app.
  const cellPadding = columns > 1 ? 8 : 0;

  if (isLoading)
    return (
      <View className='justify-center items-center h-full'>
        <Loader />
      </View>
    );

  if (!libraries)
    return (
      <View className='h-full w-full flex justify-center items-center'>
        <Text className='text-lg text-neutral-500'>
          {t("library.no_libraries_found")}
        </Text>
      </View>
    );

  return (
    <FlashList
      key={columns}
      numColumns={columns}
      extraData={settings}
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? 17 : 0,
        paddingHorizontal: isRow ? 0 : 17,
        paddingBottom: 150,
        paddingLeft: insets.left + 17 - cellPadding,
        paddingRight: insets.right + 17 - cellPadding,
      }}
      data={libraries}
      renderItem={({ item }) => (
        <View style={{ flex: 1, paddingHorizontal: cellPadding }}>
          <LibraryItemCard library={item} />
        </View>
      )}
      keyExtractor={(item) => item.Id || ""}
      ItemSeparatorComponent={() =>
        isRow ? (
          <View
            style={{
              height: StyleSheet.hairlineWidth,
            }}
            className='bg-neutral-800 mx-2 my-4'
          />
        ) : (
          <View className='h-4' />
        )
      }
    />
  );
};
