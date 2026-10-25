/**
 * Streamyfin Next's "Frost" look: dark Liquid Glass over an ambient backdrop
 * taken from the artwork in focus. The accent itself is Colors.primary; these
 * are the glass surfaces and the ambient layer.
 */
export const FrostColors = {
  /** Under the ambient artwork, and what shows while it loads. */
  ground: "#07090C",
  /** Darkens the blurred artwork so white text on it stays readable. */
  scrim: "rgba(5, 7, 10, 0.55)",
  /** A glass surface: control pills, panels. */
  glass: "rgba(0, 0, 0, 0.35)",
  /** A lighter glass surface: buttons on glass, the selected pill. */
  glassRaised: "rgba(255, 255, 255, 0.14)",
  /** The hairline edge every glass surface carries. */
  glassEdge: "rgba(255, 255, 255, 0.16)",
} as const;

/**
 * What covers the ambient artwork under a detail page's content: dark enough
 * for body text, light enough that the artwork's colour still comes through.
 */
export const FROST_CONTENT_FILL = "rgba(7, 9, 12, 0.45)";

/**
 * The glass sheet a detail page's content rides up on, over the artwork:
 * nearly opaque so long overviews stay readable, with the ambient colour
 * still faintly through it.
 */
export const FROST_SHEET = {
  fill: "rgba(13, 28, 36, 0.92)",
  edge: "rgba(255, 255, 255, 0.18)",
  radius: 32,
} as const;

export const FrostAmbient = {
  /** expo-image blur radius over the backdrop. */
  blurRadius: 60,
  /** Backdrop request width in pixels: it is blurred, so small is enough. */
  imageWidth: 480,
  /** Cross-fade when the ambient artwork changes, in ms. */
  transitionMs: 600,
} as const;

/** Glass blur intensity for expo-blur surfaces (player controls). */
export const FROST_BLUR_INTENSITY = 40;
