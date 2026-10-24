import { atom, useAtomValue } from "jotai";
import { Platform } from "react-native";
import type { DuoLayoutState, DuoRect } from "@/modules";

/** Until the native observer reports (and everywhere but an iPhone Duo). */
export const DEFAULT_DUO_LAYOUT: DuoLayoutState = {
  verticalBarEdge: "none",
  hinge: "unknown",
  fold: null,
  windowWidth: 0,
  windowHeight: 0,
};

export const duoLayoutAtom = atom<DuoLayoutState>(DEFAULT_DUO_LAYOUT);

/** The iPhone Duo layout state: vertical bar edge, hinge, fold. */
export const useDuoLayout = () => useAtomValue(duoLayoutAtom);

/**
 * How the fold splits the window while the device is partly open:
 * "vertical" = held like a book (left | right), "horizontal" = standing on a
 * table (top / bottom), null = flat or closed.
 */
export const foldAxis = (
  fold: DuoRect | null,
): "vertical" | "horizontal" | null => {
  if (!fold) return null;
  return fold.height >= fold.width ? "vertical" : "horizontal";
};

/** The fold while the device stands on a table (top / bottom), else null. */
export const useTableFold = (): DuoRect | null => {
  const { fold } = useDuoLayout();
  return !Platform.isTV && foldAxis(fold) === "horizontal" ? fold : null;
};

/** The fold while the device is held like a book (left | right), else null. */
export const useBookFold = (): DuoRect | null => {
  const { fold } = useDuoLayout();
  return !Platform.isTV && foldAxis(fold) === "vertical" ? fold : null;
};
