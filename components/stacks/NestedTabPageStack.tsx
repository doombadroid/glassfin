import { Stack } from "expo-router";
import { type ComponentProps, useMemo } from "react";
import { Platform } from "react-native";
import { HeaderGradient } from "@/components/common/HeaderGradient";
import { useTabContentInsets } from "@/components/duo/TabContentInsets";

type ICommonScreenOptions = ComponentProps<typeof Stack.Screen>["options"];

/**
 * Applied via `<Stack screenOptions={...}>` in every tab layout.
 *
 * The native stack renders its own back button, aligned by UIKit / the Android
 * Toolbar, so screens must never supply a custom `headerLeft` just to go back —
 * that is what knocked every header out of alignment. These two options are all
 * it takes to match the app's look: a white chevron with no back title.
 *
 * `scrollEdgeEffects.top` is hidden because on iOS 26 UIKit paints a soft blur
 * under the navigation bar of any inset-adjusted scroll view, which defeats the
 * fully transparent headers this app uses. Readability over content comes from
 * `headerBackground` instead: a dark-to-transparent scrim behind every header.
 */
export const stackScreenOptions: ICommonScreenOptions = {
  headerTintColor: "white",
  headerBackButtonDisplayMode: "minimal",
  scrollEdgeEffects: { top: "hidden" },
  headerBackground:
    Platform.OS === "ios" ? () => <HeaderGradient /> : undefined,
};

/**
 * `stackScreenOptions` for a tab's stack, plus side padding on every screen
 * that keeps its content clear of the tab's left/right insets: the status bar
 * strip and vertical tab bar on a folded iPhone Duo, the sidebar when it's
 * unfolded. Zero on a regular iPhone in portrait. Screens that want artwork to
 * run under those strips (the Frost ambient backdrop) bleed it back out.
 */
export const useStackScreenOptions = (): ICommonScreenOptions => {
  const { left, right } = useTabContentInsets();
  return useMemo(
    () => ({
      ...stackScreenOptions,
      contentStyle: { paddingLeft: left, paddingRight: right },
    }),
    [left, right],
  );
};

export const commonScreenOptions: ICommonScreenOptions = {
  title: "",
  headerShown: !Platform.isTV,
  headerTransparent: Platform.OS === "ios",
  headerShadowVisible: false,
  headerBlurEffect: "none",
};

const routes = [
  "persons/[personId]",
  "studios/[studioId]",
  "items/page",
  "series/[id]",
  "music/album/[albumId]",
  "music/artist/[artistId]",
  "music/playlist/[playlistId]",
];

export const nestedTabPageScreenOptions: Record<string, ICommonScreenOptions> =
  Object.fromEntries(routes.map((route) => [route, commonScreenOptions]));
