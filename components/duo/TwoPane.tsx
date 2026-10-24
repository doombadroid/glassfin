import { type ReactNode, useCallback, useRef, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { useBookFold } from "@/utils/atoms/duoLayout";

/** Below this width the panes stack, as on a phone. */
const SIDE_BY_SIDE_MIN_WIDTH = 700;
/** The primary pane's share of the width when there's no fold to follow. */
const PRIMARY_SHARE = 0.46;
const GUTTER = 24;
/** Extra clear space either side of the fold: buttons are hard to hit in it. */
const FOLD_MARGIN = 12;

interface Box {
  x: number;
  width: number;
}

/**
 * The primary pane's width and the gap after it, or null to stack. Held like
 * a book, with the fold inside the box, the gap covers the fold plus a margin
 * either side; otherwise the primary pane takes a fixed share.
 */
export const twoPaneSplit = (
  box: Box,
  fold: { x: number; width: number } | null,
): { primaryWidth: number; gap: number } | null => {
  if (box.width < SIDE_BY_SIDE_MIN_WIDTH) return null;
  if (fold) {
    const foldStart = fold.x - box.x;
    const foldEnd = foldStart + fold.width;
    if (foldStart > 0 && foldEnd < box.width) {
      return {
        primaryWidth: foldStart - FOLD_MARGIN,
        gap: foldEnd - foldStart + FOLD_MARGIN * 2,
      };
    }
  }
  return { primaryWidth: box.width * PRIMARY_SHARE - GUTTER / 2, gap: GUTTER };
};

/**
 * Two panes side by side on a wide window (the unfolded iPhone Duo, iPad),
 * stacked otherwise. Held like a book, the split lands on the fold, so
 * nothing in either pane sits in the curve. Same content in every pose: only
 * the arrangement changes.
 */
export function TwoPane({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary: ReactNode;
}) {
  const ref = useRef<View>(null);
  const [box, setBox] = useState<Box | null>(null);
  const bookFold = useBookFold();

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    ref.current?.measureInWindow((x) =>
      setBox((prev) =>
        prev && prev.x === x && prev.width === width ? prev : { x, width },
      ),
    );
  }, []);

  const split = box ? twoPaneSplit(box, bookFold) : null;

  return (
    <View
      ref={ref}
      onLayout={onLayout}
      style={split ? { flexDirection: "row", gap: split.gap } : undefined}
    >
      <View style={split ? { width: split.primaryWidth } : undefined}>
        {primary}
      </View>
      <View style={split ? { flex: 1, minWidth: 0 } : undefined}>
        {secondary}
      </View>
    </View>
  );
}
