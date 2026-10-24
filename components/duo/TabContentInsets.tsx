import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { Platform } from "react-native";
import { SafeAreaListener } from "react-native-safe-area-context";

export interface HorizontalInsets {
  left: number;
  right: number;
}

const NONE: HorizontalInsets = { left: 0, right: 0 };

const TabContentInsetsContext = createContext<HorizontalInsets>(NONE);

/**
 * The left and right insets of a tab's content area: the status bar strip and
 * vertical tab bar on the iPhone Duo, the sidebar on a regular-width window,
 * the notch in landscape. They come from the tab's own native view, so unlike
 * the root `useSafeAreaInsets()` they include what the tab bar takes. Top and
 * bottom are left alone: screens already handle those their own way.
 */
export const useTabContentInsets = () => useContext(TabContentInsetsContext);

/**
 * `screenLayout` for the tab navigator. Each tab gets an invisible listener on
 * its own native view and shares that view's horizontal insets.
 */
export function TabContentInsets({ children }: PropsWithChildren) {
  const [insets, setInsets] = useState<HorizontalInsets>(NONE);

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
      <TabContentInsetsContext.Provider value={insets}>
        {children}
      </TabContentInsetsContext.Provider>
    </SafeAreaListener>
  );
}
