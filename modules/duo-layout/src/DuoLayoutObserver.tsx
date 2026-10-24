import { requireNativeView } from "expo";
import type * as React from "react";
import { Platform, StyleSheet } from "react-native";
import type { DuoLayoutState } from "./DuoLayout.types";

interface NativeProps {
  style?: unknown;
  pointerEvents?: "none";
  onDuoLayoutChange: (event: { nativeEvent: DuoLayoutState }) => void;
}

let NativeObserver: React.ComponentType<NativeProps> | null = null;

if (Platform.OS === "ios" && !Platform.isTV) {
  try {
    NativeObserver = requireNativeView<NativeProps>("DuoLayout");
  } catch {
    // Not linked (e.g. Expo Go): the app keeps its default layout.
  }
}

/**
 * Mount once, at the root. It covers the window invisibly so it sees every
 * rotation, fold and size change, and reports the iPhone Duo layout state.
 * Renders nothing where the native view isn't available.
 */
export function DuoLayoutObserver({
  onChange,
}: {
  onChange: (state: DuoLayoutState) => void;
}) {
  if (!NativeObserver) return null;
  return (
    <NativeObserver
      style={StyleSheet.absoluteFill}
      pointerEvents='none'
      onDuoLayoutChange={(e) => onChange(e.nativeEvent)}
    />
  );
}
