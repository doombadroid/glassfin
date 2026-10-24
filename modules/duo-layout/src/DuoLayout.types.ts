/** A rectangle in window coordinates (points). */
export interface DuoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type VerticalBarEdge = "left" | "right" | "none";

export type HingeStatus = "closed" | "partiallyOpen" | "fullyOpen" | "unknown";

/** What the native observer reports; see DuoLayoutObserverView.swift. */
export interface DuoLayoutState {
  /** Where the system puts its vertical bar (status bar, nav items, tab bar). */
  verticalBarEdge: VerticalBarEdge;
  hinge: HingeStatus;
  /** The fold while the device is partly open, else null. */
  fold: DuoRect | null;
  windowWidth: number;
  windowHeight: number;
}
