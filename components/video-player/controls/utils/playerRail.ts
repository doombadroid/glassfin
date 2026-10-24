import type { EdgeInsets } from "react-native-safe-area-context";

/**
 * A side inset at least this much bigger than the other one means the system
 * keeps a strip on that edge (the folded iPhone Duo's sensor and status bar
 * strip), not just a notch both sides share.
 */
const RAIL_MIN_ASYMMETRY = 20;

/**
 * Which edge the player's header buttons should stack down, or null to keep
 * them in the usual row along the top. Apple hasn't said which edge holds the
 * sensor when the folded iPhone Duo is in landscape, so this follows the
 * insets rather than a fixed side.
 */
export const playerRailEdge = (
  insets: Pick<EdgeInsets, "left" | "right">,
): "left" | "right" | null => {
  if (Math.abs(insets.left - insets.right) < RAIL_MIN_ASYMMETRY) return null;
  return insets.right > insets.left ? "right" : "left";
};
