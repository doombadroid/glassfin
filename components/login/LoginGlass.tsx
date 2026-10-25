import type React from "react";
import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  type StyleProp,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Colors } from "@/constants/Colors";

// The sign-in screens' glass language (Login A): translucent rows and fields
// with a hairline border, mint for the one action that moves you forward.
export const GLASS_FILL = "rgba(255,255,255,0.08)";
export const GLASS_BORDER = "rgba(255,255,255,0.18)";
export const GLASS_SUBTLE_TEXT = "#B5C0C8";

/** The glass-sail mark from the app icon, drawn as vectors. */
export const SailMark: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <Svg
    width={size}
    height={size}
    viewBox='0 0 100 100'
    accessibilityElementsHidden
    importantForAccessibility='no-hide-descendants'
  >
    <Path
      d='M38 13 L38 73'
      stroke='#FFFFFF'
      strokeOpacity={0.85}
      strokeWidth={2.6}
      strokeLinecap='round'
    />
    <Path
      d='M41 17 Q67 31 78 66 L41 66 Z'
      fill='#FFFFFF'
      fillOpacity={0.2}
      stroke='#FFFFFF'
      strokeWidth={2.4}
      strokeLinejoin='round'
    />
    <Path d='M54 40 L54 58 L68 49 Z' fill='#B9F3E0' />
    <Path
      d='M19 72 L83 72 Q79 84 70 86 L32 86 Q23 84 19 72 Z'
      fill={Colors.primary}
    />
  </Svg>
);

/** Small uppercase label over a group of rows. */
export const GlassLabel: React.FC<PropsWithChildren> = ({ children }) => (
  <Text
    style={{
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      color: GLASS_SUBTLE_TEXT,
      textTransform: "uppercase",
    }}
  >
    {children}
  </Text>
);

interface GlassRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Mint dot and border: the server the screen suggests. */
  highlighted?: boolean;
  disabled?: boolean;
  /** Replaces the dot, e.g. a search icon or a spinner. */
  leading?: ReactNode;
  trailing?: ReactNode;
  accessibilityLabel?: string;
}

/** A server (or action) as one glass row. */
export const GlassRow: React.FC<GlassRowProps> = ({
  title,
  subtitle,
  onPress,
  highlighted = false,
  disabled = false,
  leading,
  trailing,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
    accessibilityRole='button'
    accessibilityLabel={accessibilityLabel}
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 60,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: highlighted ? "rgba(143,230,203,0.5)" : GLASS_BORDER,
      backgroundColor: highlighted ? "rgba(143,230,203,0.1)" : GLASS_FILL,
      opacity: disabled ? 0.6 : 1,
    }}
  >
    {leading ?? (
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: highlighted
            ? Colors.primary
            : "rgba(255,255,255,0.4)",
        }}
      />
    )}
    <View style={{ flex: 1 }}>
      <Text
        numberOfLines={1}
        style={{ color: "white", fontSize: 15, fontWeight: "700" }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          numberOfLines={1}
          style={{ color: GLASS_SUBTLE_TEXT, fontSize: 12, marginTop: 2 }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
    {trailing}
  </TouchableOpacity>
);

interface GlassPrimaryButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: string;
}

/** The mint pill: the one action that moves sign-in forward. */
export const GlassPrimaryButton: React.FC<GlassPrimaryButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  style,
  children,
}) => (
  <TouchableOpacity
    onPress={() => {
      if (!loading && !disabled) onPress();
    }}
    disabled={disabled || loading}
    activeOpacity={0.8}
    accessibilityRole='button'
    accessibilityState={{ disabled: disabled || loading, busy: loading }}
    style={[
      {
        minHeight: 54,
        borderRadius: 27,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        backgroundColor: Colors.primary,
        opacity: disabled ? 0.5 : 1,
      },
      style,
    ]}
  >
    {loading ? (
      <ActivityIndicator color={Colors.onPrimary} />
    ) : (
      <Text
        style={{ color: Colors.onPrimary, fontSize: 16, fontWeight: "800" }}
      >
        {children}
      </Text>
    )}
  </TouchableOpacity>
);

/** Style for the shared Input so fields match the glass rows. */
export const glassInputStyle = {
  minHeight: 52,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: GLASS_BORDER,
  backgroundColor: "rgba(255,255,255,0.06)",
  fontSize: 15,
};
