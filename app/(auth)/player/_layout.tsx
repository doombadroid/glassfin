import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";

import { useOrientation } from "@/hooks/useOrientation";
import { useSettings } from "@/utils/atoms/settings";

export default function Layout() {
  const { settings } = useSettings();
  const { lockOrientation, unlockOrientation } = useOrientation();

  useEffect(() => {
    if (settings?.defaultVideoOrientation) {
      lockOrientation(settings.defaultVideoOrientation);
    }

    // Re-apply orientation lock when app returns to foreground (iOS resets it)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && settings?.defaultVideoOrientation) {
        lockOrientation(settings.defaultVideoOrientation);
      }
    });

    return () => {
      subscription.remove();
      unlockOrientation();
    };
  }, [settings?.defaultVideoOrientation, lockOrientation, unlockOrientation]);

  return (
    <>
      {/* iOS hides it through the screen's statusBarHidden below. */}
      {Platform.OS === "android" && <SystemBars hidden />}
      <Stack>
        <Stack.Screen
          name='direct-player'
          options={{
            headerShown: false,
            // iOS 27 SDK: only view controllers can hide the status bar
            // (SystemBars' app-wide call does nothing there).
            statusBarHidden: true,
            autoHideHomeIndicator: true,
            title: "",
            animation: "fade",
          }}
        />
      </Stack>
    </>
  );
}
