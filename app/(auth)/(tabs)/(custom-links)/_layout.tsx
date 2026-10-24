import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useStackScreenOptions } from "@/components/stacks/NestedTabPageStack";

export default function CustomMenuLayout() {
  const screenOptions = useStackScreenOptions();
  const { t } = useTranslation();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name='index'
        options={{
          headerShown: !Platform.isTV,
          headerLargeTitle: true,
          headerTitle: t("tabs.custom_links"),
          headerBlurEffect: "none",
          headerTransparent: Platform.OS === "ios",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
