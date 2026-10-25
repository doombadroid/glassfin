import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { t } from "i18next";
import { useAtom } from "jotai";
import { type ReactNode, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HEADER_ICON_SIZE,
  HeaderButton,
} from "@/components/common/HeaderButton";
import { SettingSwitch } from "@/components/common/SettingSwitch";
import { Text } from "@/components/common/Text";
import { ListGlassContext, ListGroup } from "@/components/list/ListGroup";
import { ListItem } from "@/components/list/ListItem";
import { AppLanguageSelector } from "@/components/settings/AppLanguageSelector";
import { QuickConnect } from "@/components/settings/QuickConnect";
import { StorageSettings } from "@/components/settings/StorageSettings";
import { UserInfo } from "@/components/settings/UserInfo";
import { NOTIFICATIONS_SETTINGS_ROUTE } from "@/constants/Notifications";
import useRouter from "@/hooks/useAppRouter";
import { useMyNotifications } from "@/hooks/useMyNotifications";
import { useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import { useSyncPlay } from "@/providers/SyncPlayProvider";
import { useSettings } from "@/utils/atoms/settings";
import { matchesSettingsQuery } from "@/utils/settings/settingsSearch";

// TV-specific settings component
const SettingsTV = Platform.isTV ? require("./settings.tv").default : null;

// Mobile settings component
function SettingsMobile() {
  const router = useRouter();
  const { available: syncPlayAvailable } = useSyncPlay();
  const { settings, updateSettings } = useSettings();
  const insets = useSafeAreaInsets();
  const { supported: notificationsSupported, mine: notifications } =
    useMyNotifications();
  const [_user] = useAtom(userAtom);
  const { logout } = useJellyfin();

  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          accessibilityLabel={t("home.settings.log_out_button")}
          onPress={() => {
            logout();
          }}
        >
          <Ionicons
            name='log-out-outline'
            size={HEADER_ICON_SIZE}
            color='#ef4444'
          />
        </HeaderButton>
      ),
    });
  }, []);

  const [query, setQuery] = useState("");

  // Every entry of the index, by section. Rows go in the section's glass
  // group; blocks are components that draw their own group (user info,
  // storage, language). The search matches titles plus a few keywords.
  // Covered by utils/settings/settingsSearch.test.ts.
  const sections: SettingsSection[] = [
    {
      id: "account",
      title: t("home.settings.search.sections.account"),
      entries: [
        {
          id: "user",
          title: t("home.settings.user_info.user_info_title"),
          keywords: t("home.settings.search.keywords.user"),
          block: true,
          node: <UserInfo />,
        },
        {
          id: "quick-connect",
          title: t("home.settings.quick_connect.quick_connect_title"),
          keywords: t("home.settings.search.keywords.quick_connect"),
          block: true,
          node: <QuickConnect />,
        },
        {
          id: "pair",
          title: t("pairing.pair_with_phone"),
          keywords: t("home.settings.search.keywords.pair"),
          // On every phone: Quick Connect needs no local network access.
          // Covered by components/companion/companionLoginEntry.test.tsx.
          node: (
            <ListItem
              key='pair'
              onPress={() =>
                router.push("/(auth)/(tabs)/(home)/companion-login")
              }
              title={t("pairing.pair_with_phone")}
              textColor='blue'
            />
          ),
        },
      ],
    },
    {
      id: "watching",
      title: t("home.settings.search.sections.watching"),
      entries: [
        {
          id: "playback",
          title: t("home.settings.playback_controls.title"),
          keywords: t("home.settings.search.keywords.playback"),
          node: (
            <ListItem
              key='playback'
              onPress={() => router.push("/settings/playback-controls/page")}
              showArrow
              title={t("home.settings.playback_controls.title")}
            />
          ),
        },
        {
          id: "audio-subtitles",
          title: t("home.settings.audio_subtitles.title"),
          keywords: t("home.settings.search.keywords.audio_subtitles"),
          node: (
            <ListItem
              key='audio-subtitles'
              onPress={() => router.push("/settings/audio-subtitles/page")}
              showArrow
              title={t("home.settings.audio_subtitles.title")}
              value={settings.defaultSubtitleLanguage?.DisplayName}
            />
          ),
        },
        {
          id: "music",
          title: t("home.settings.music.title"),
          keywords: t("home.settings.search.keywords.music"),
          node: (
            <ListItem
              key='music'
              onPress={() => router.push("/settings/music/page")}
              showArrow
              title={t("home.settings.music.title")}
            />
          ),
        },
        ...(syncPlayAvailable
          ? [
              {
                id: "syncplay",
                title: t("syncplay.ignore_wait"),
                keywords: `${t("syncplay.title")} ${t("home.settings.search.keywords.syncplay")}`,
                node: (
                  <ListItem
                    key='syncplay'
                    title={t("syncplay.ignore_wait")}
                    subtitle={t("syncplay.ignore_wait_setting_hint")}
                  >
                    <SettingSwitch
                      testID='syncplay-settings-ignore-wait'
                      accessibilityLabel={t("syncplay.ignore_wait")}
                      value={settings.syncPlayIgnoreWait}
                      onValueChange={(value) =>
                        updateSettings({ syncPlayIgnoreWait: value })
                      }
                    />
                  </ListItem>
                ),
              },
            ]
          : []),
      ],
    },
    {
      id: "library",
      title: t("home.settings.search.sections.library"),
      entries: [
        {
          id: "hide-libraries",
          title: t("home.settings.other.hide_libraries"),
          keywords: t("home.settings.search.keywords.hide_libraries"),
          node: (
            <ListItem
              key='hide-libraries'
              onPress={() =>
                router.push("/settings/appearance/hide-libraries/page")
              }
              showArrow
              title={t("home.settings.other.hide_libraries")}
              value={
                settings.hiddenLibraries?.length
                  ? String(settings.hiddenLibraries.length)
                  : undefined
              }
            />
          ),
        },
        {
          id: "storage",
          title: t("home.settings.storage.storage_title"),
          keywords: t("home.settings.search.keywords.storage"),
          block: true,
          node: <StorageSettings />,
        },
      ],
    },
    {
      id: "app",
      title: t("home.settings.search.sections.app"),
      entries: [
        {
          id: "appearance",
          title: t("home.settings.appearance.title"),
          keywords: t("home.settings.search.keywords.appearance"),
          node: (
            <ListItem
              key='appearance'
              onPress={() => router.push("/settings/appearance/page")}
              showArrow
              title={t("home.settings.appearance.title")}
            />
          ),
        },
        // Only once the server's plugin answered: an older one has no such screen.
        ...(notificationsSupported && notifications !== undefined
          ? [
              {
                id: "notifications",
                title: t("home.settings.notifications.title"),
                keywords: t("home.settings.search.keywords.notifications"),
                node: (
                  <ListItem
                    key='notifications'
                    onPress={() => router.push(NOTIFICATIONS_SETTINGS_ROUTE)}
                    showArrow
                    title={t("home.settings.notifications.title")}
                  />
                ),
              },
            ]
          : []),
        {
          id: "integrations",
          title: t("home.settings.plugins.plugins_title"),
          keywords: t("home.settings.search.keywords.integrations"),
          node: (
            <ListItem
              key='integrations'
              onPress={() => router.push("/settings/plugins/page")}
              showArrow
              title={t("home.settings.plugins.plugins_title")}
            />
          ),
        },
        {
          id: "network",
          title: t("home.settings.network.title"),
          keywords: t("home.settings.search.keywords.network"),
          node: (
            <ListItem
              key='network'
              onPress={() => router.push("/settings/network/page")}
              showArrow
              title={t("home.settings.network.title")}
            />
          ),
        },
        {
          id: "intro",
          title: t("home.settings.intro.title"),
          keywords: t("home.settings.search.keywords.intro"),
          node: (
            <ListItem
              key='intro'
              onPress={() => router.push("/settings/intro/page")}
              showArrow
              title={t("home.settings.intro.title")}
            />
          ),
        },
        {
          id: "logs",
          title: t("home.settings.logs.logs_title"),
          keywords: t("home.settings.search.keywords.logs"),
          node: (
            <ListItem
              key='logs'
              onPress={() => router.push("/settings/logs/page")}
              showArrow
              title={t("home.settings.logs.logs_title")}
            />
          ),
        },
        {
          id: "support",
          title: t("home.settings.support.title"),
          keywords: t("home.settings.search.keywords.support"),
          node: (
            <ListItem
              key='support'
              onPress={() => router.push("/settings/support/page")}
              showArrow
              title={t("home.settings.support.title")}
            />
          ),
        },
        {
          id: "acknowledgements",
          title: t("home.settings.acknowledgements.title"),
          keywords: t("home.settings.search.keywords.acknowledgements"),
          node: (
            <ListItem
              key='acknowledgements'
              onPress={() => router.push("/settings/acknowledgements/page")}
              showArrow
              title={t("home.settings.acknowledgements.title")}
            />
          ),
        },
        {
          id: "language",
          title: t("home.settings.languages.title"),
          keywords: `${t("home.settings.languages.app_language")} ${t("home.settings.search.keywords.language")}`,
          block: true,
          node: <AppLanguageSelector />,
        },
      ],
    },
  ];

  const visible = sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) =>
        matchesSettingsQuery(entry, query),
      ),
    }))
    .filter((section) => section.entries.length > 0);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      keyboardDismissMode='on-drag'
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <ListGlassContext.Provider value>
        <View
          className='p-4 flex flex-col'
          style={{ paddingTop: Platform.OS === "android" ? 10 : 0 }}
        >
          <View className='flex-row items-center mb-5 rounded-full border border-white/20 bg-white/10 pl-4 pr-1 min-h-[46px]'>
            <Ionicons name='search' size={16} color='#B5C0C8' />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("home.settings.search.placeholder")}
              placeholderTextColor='#9AA5AD'
              accessibilityLabel={t("home.settings.search.label")}
              autoCorrect={false}
              autoCapitalize='none'
              clearButtonMode='never'
              returnKeyType='search'
              className='flex-1 text-white text-[15px] px-2 py-3'
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery("")}
                accessibilityRole='button'
                accessibilityLabel={t("home.settings.search.clear")}
                className='w-11 h-11 items-center justify-center'
              >
                <Ionicons name='close-circle' size={18} color='#B5C0C8' />
              </TouchableOpacity>
            )}
          </View>

          {visible.length === 0 ? (
            <Text className='text-center text-neutral-400 mt-8'>
              {t("home.settings.search.no_match", { query: query.trim() })}
            </Text>
          ) : (
            visible.map((section) => {
              const rows = section.entries.filter((entry) => !entry.block);
              const blocks = section.entries.filter((entry) => entry.block);
              return (
                <View key={section.id} className='mb-4 gap-4'>
                  {rows.length > 0 && (
                    <ListGroup title={section.title}>
                      {rows.map((entry) => entry.node)}
                    </ListGroup>
                  )}
                  {blocks.map((entry) => (
                    <View key={entry.id}>{entry.node}</View>
                  ))}
                </View>
              );
            })
          )}
        </View>
      </ListGlassContext.Provider>
    </ScrollView>
  );
}

interface SettingsEntry {
  id: string;
  title: string;
  keywords?: string;
  /** Draws its own group, so it sits after the section's rows. */
  block?: boolean;
  node: ReactNode;
}

interface SettingsSection {
  id: string;
  title: string;
  entries: SettingsEntry[];
}

export default function settings() {
  // Use TV settings component on TV platforms
  if (Platform.isTV && SettingsTV) {
    return <SettingsTV />;
  }

  return <SettingsMobile />;
}
