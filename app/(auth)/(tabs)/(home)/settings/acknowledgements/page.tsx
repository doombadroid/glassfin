import { useTranslation } from "react-i18next";
import { Linking, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { ListGroup } from "@/components/list/ListGroup";
import { ListItem } from "@/components/list/ListItem";

// The MPL-2.0 credit lives in the app, not the store listing: Glassfin is a
// fork of Streamyfin, and its authors are owed the attribution.
const LINKS = [
  {
    title: "home.settings.acknowledgements.source_code",
    url: "https://github.com/doombadroid/glassfin",
  },
  {
    title: "home.settings.acknowledgements.streamyfin_project",
    url: "https://github.com/streamyfin/streamyfin",
  },
  {
    title: "home.settings.acknowledgements.licence",
    url: "https://www.mozilla.org/MPL/2.0/",
  },
] as const;

export default function AcknowledgementsPage() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View
        className='p-4 flex flex-col gap-4'
        style={{ paddingTop: Platform.OS === "android" ? 10 : 0 }}
      >
        <Text className='text-sm leading-5'>
          {t("home.settings.acknowledgements.body")}
        </Text>
        <Text className='text-sm leading-5 text-neutral-400'>
          {t("home.settings.acknowledgements.libraries")}
        </Text>
        <ListGroup title={t("home.settings.acknowledgements.links")}>
          {LINKS.map((link) => (
            <ListItem
              key={link.url}
              title={t(link.title)}
              showArrow
              onPress={() => Linking.openURL(link.url)}
            />
          ))}
        </ListGroup>
        <View className='h-24' />
      </View>
    </ScrollView>
  );
}
