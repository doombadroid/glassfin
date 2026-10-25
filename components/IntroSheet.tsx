import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Button } from "@/components/Button";
import { SettingSwitch } from "@/components/common/SettingSwitch";
import { Text } from "@/components/common/Text";
import { useWindowSafeAreaInsets } from "@/components/duo/TabContentInsets";
import { Colors } from "@/constants/Colors";
import { SHEET_MAX_HEIGHT_RATIO } from "@/constants/Values";
import useRouter from "@/hooks/useAppRouter";
import { useDuoLayout } from "@/utils/atoms/duoLayout";
import { useSettings } from "@/utils/atoms/settings";
import { storage } from "@/utils/mmkv";
import { crashReportingAvailable } from "@/utils/sentry";

// What the fold does, for a phone that folds.
const DUO_ROWS = [
  {
    icon: "laptop-outline",
    title: "home.intro.tabletop_title",
    body: "home.intro.tabletop_description",
  },
  {
    icon: "book-outline",
    title: "home.intro.book_title",
    body: "home.intro.book_description",
  },
  {
    icon: "tablet-landscape-outline",
    title: "home.intro.unfolded_title",
    body: "home.intro.unfolded_description",
  },
  {
    icon: "cloud-download-outline",
    title: "home.intro.offline_title",
    body: "home.intro.offline_description",
  },
] as const;

// Any other iPhone: the poses above don't exist there.
const PHONE_ROWS = [
  {
    icon: "play-circle-outline",
    title: "home.intro.player_title",
    body: "home.intro.player_description",
  },
  {
    icon: "moon-outline",
    title: "home.intro.tonight_title",
    body: "home.intro.tonight_description",
  },
  {
    icon: "cloud-download-outline",
    title: "home.intro.offline_title",
    body: "home.intro.offline_description",
  },
  {
    icon: "phone-portrait-outline",
    title: "home.intro.duo_ready_title",
    body: "home.intro.duo_ready_description",
  },
] as const;

export interface IntroSheetRef {
  present: () => void;
  dismiss: () => void;
}

export const IntroSheet = forwardRef<IntroSheetRef>((_, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { t } = useTranslation();
  const insets = useWindowSafeAreaInsets();
  // The intro is taller than a small phone. Uncapped, a dynamically sized sheet
  // grows to the whole window and the welcome title lands under the status bar.
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const { settings, updateSettings, pluginSettings } = useSettings();
  // Only iPhone Duo reports a hinge, a fold or the outer screen's vertical
  // bar; the hinge alone can stay "unknown" until the phone first moves.
  const duo = useDuoLayout();
  const foldable =
    duo.hinge !== "unknown" || duo.verticalBarEdge !== "none" || !!duo.fold;
  // An admin-locked toggle cannot take the write: updateSettings drops it and
  // the read stays pinned, so the row would look broken rather than locked.
  const sentryLocked = pluginSettings?.sentryEnabled?.locked === true;

  useImperativeHandle(ref, () => ({
    present: () => {
      storage.set("hasShownIntro", true);
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss();
    },
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const handleDismiss = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleGoToSettings = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    router.push("/settings");
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      maxDynamicContentSize={windowHeight * SHEET_MAX_HEIGHT_RATIO}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: Colors.background }}
      handleIndicatorStyle={{ backgroundColor: "#737373" }}
    >
      <BottomSheetScrollView
        style={{
          paddingLeft: Math.max(16, insets.left),
          paddingRight: Math.max(16, insets.right),
        }}
      >
        <View className={Platform.isTV ? "py-5 space-y-4" : "py-4 space-y-6"}>
          <View>
            <Text className='text-3xl font-bold text-center mb-2'>
              {t("home.intro.welcome")}
            </Text>
            <Text className='text-center'>{t("home.intro.tagline")}</Text>
          </View>

          {/* The Duo poses lead on a phone that folds; anywhere else they
              don't exist, so the sheet shows what every iPhone gets. */}
          <View>
            <Text className='text-lg font-bold'>
              {t(foldable ? "home.intro.duo_title" : "home.intro.inside_title")}
            </Text>
            {(foldable ? DUO_ROWS : PHONE_ROWS).map((row) => (
              <View key={row.title} className='flex flex-row items-center mt-4'>
                <View
                  style={{ width: 50, height: 50 }}
                  className='flex items-center justify-center'
                >
                  <Ionicons name={row.icon} size={28} color={Colors.primary} />
                </View>
                <View className='shrink ml-2'>
                  <Text className='font-bold mb-1'>{t(row.title)}</Text>
                  <Text className='shrink text-xs'>{t(row.body)}</Text>
                </View>
              </View>
            ))}
          </View>

          {crashReportingAvailable && (
            <View>
              <Text className='text-lg font-bold'>
                {t("home.intro.crash_reports_title")}
              </Text>
              {/* The whole row toggles: the Switch itself isn't focusable on TV,
                  so the TouchableOpacity carries the remote-select press there. */}
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={sentryLocked}
                onPress={() =>
                  updateSettings({ sentryEnabled: !settings?.sentryEnabled })
                }
                className='flex flex-row items-center mt-2'
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                  }}
                  className='flex items-center justify-center'
                >
                  <Ionicons name='bug-outline' size={28} color='white' />
                </View>
                <View className='shrink flex-1 ml-2 mr-3'>
                  <Text className='shrink text-xs'>
                    {t("home.intro.crash_reports_description")}
                  </Text>
                </View>
                {/* Presentational only — the row press above is the single
                    mutation path. The inertness has to come from a wrapping
                    View: a Switch ignores its own pointerEvents on Android, so
                    its native touch handler flipped it and the controlled value
                    snapped it straight back — a toggle that couldn't be
                    disabled by tapping the one control that looks tappable. */}
                <View pointerEvents='none'>
                  <SettingSwitch
                    value={settings?.sentryEnabled === true}
                    disabled={sentryLocked}
                  />
                </View>
              </TouchableOpacity>
              {sentryLocked && (
                <Text className='text-xs text-red-500 mt-1'>
                  {t("home.settings.disabled_by_admin")}
                </Text>
              )}
            </View>
          )}

          <View>
            <Button onPress={handleDismiss} className='mt-4'>
              {t("home.intro.done_button")}
            </Button>
            <TouchableOpacity onPress={handleGoToSettings} className='mt-4'>
              <Text className='text-center' style={{ color: Colors.primary }}>
                {t("home.intro.go_to_settings_button")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: insets.bottom }} />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

IntroSheet.displayName = "IntroSheet";
