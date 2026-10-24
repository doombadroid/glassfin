import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  type EdgeInsets,
  SafeAreaInsetsContext,
  SafeAreaListener,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export interface HorizontalInsets {
  left: number;
  right: number;
}

const NONE: HorizontalInsets = { left: 0, right: 0 };

const TabContentInsetsContext = createContext<HorizontalInsets>(NONE);
const WindowInsetsContext = createContext<EdgeInsets | null>(null);

/**
 * The left and right insets of a tab's content area: the status bar strip and
 * vertical tab bar on the iPhone Duo, the sidebar on a regular-width window,
 * the notch in landscape. They come from the tab's own native view, so unlike
 * the root `useSafeAreaInsets()` they include what the tab bar takes. Top and
 * bottom are left alone: screens already handle those their own way.
 */
export const useTabContentInsets = () => useContext(TabContentInsetsContext);

/**
 * The window's safe-area insets, wherever this is called. For anything drawn
 * across the whole window from inside a tab (bottom sheets, modals): there
 * `useSafeAreaInsets()` reports zero at the sides, since the tab's screens
 * are already padded, but a sheet isn't.
 */
export const useWindowSafeAreaInsets = (): EdgeInsets => {
  const fromTab = useContext(WindowInsetsContext);
  const here = useSafeAreaInsets();
  return fromTab ?? here;
};

/**
 * `screenLayout` for the tab navigator. Each tab gets an invisible listener on
 * its own native view and shares that view's horizontal insets.
 *
 * Every tab stack pads its screens by those insets (`useStackScreenOptions`),
 * so inside a tab `useSafeAreaInsets()` reports zero at the sides: the many
 * screens that pad by `insets.left`/`insets.right` themselves would otherwise
 * pad twice. Top and bottom pass through unchanged.
 */
export function TabContentInsets({ children }: PropsWithChildren) {
  const [insets, setInsets] = useState<HorizontalInsets>(NONE);
  const parentInsets = useContext(SafeAreaInsetsContext);
  const innerInsets = useMemo(
    () => (parentInsets ? { ...parentInsets, left: 0, right: 0 } : null),
    [parentInsets],
  );

  const onChange = useCallback(
    ({ insets: next }: { insets: HorizontalInsets }) => {
      setInsets((prev) =>
        prev.left === next.left && prev.right === next.right
          ? prev
          : { left: next.left, right: next.right },
      );
    },
    [],
  );

  if (Platform.OS !== "ios" || Platform.isTV) return children;

  return (
    <SafeAreaListener style={{ flex: 1 }} onChange={onChange}>
      <WindowInsetsContext.Provider value={parentInsets}>
        <SafeAreaInsetsContext.Provider value={innerInsets}>
          <TabContentInsetsContext.Provider value={insets}>
            {children}
          </TabContentInsetsContext.Provider>
        </SafeAreaInsetsContext.Provider>
      </WindowInsetsContext.Provider>
    </SafeAreaListener>
  );
}
