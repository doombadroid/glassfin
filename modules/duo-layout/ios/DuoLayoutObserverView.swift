import ExpoModulesCore
import UIKit

/// An invisible full-window view that reports iPhone Duo layout state to JS:
/// which edge the system puts its vertical bar on, the hinge status, and the
/// fold (the division reserved region) in window coordinates.
///
/// Everything here is iOS 27.1 API. On older systems and other devices it
/// reports no vertical bar, an unknown hinge and no fold, once.
class DuoLayoutObserverView: ExpoView {
  let onDuoLayoutChange = EventDispatcher()

  private var hingeStatus = "unknown"
  private var lastPayload: NSDictionary?
  private var reportScheduled = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isUserInteractionEnabled = false

    #if os(iOS)
    if #available(iOS 27.1, *) {
      let interaction = UIHingeInteraction { [weak self] _, update in
        guard let self else { return }
        self.hingeStatus = Self.describe(update.hinge?.status)
        self.scheduleReport()
      }
      addInteraction(interaction)
    }
    if #available(iOS 17.0, *) {
      registerForTraitChanges([
        UITraitHorizontalSizeClass.self, UITraitVerticalSizeClass.self,
      ]) { (view: DuoLayoutObserverView, _: UITraitCollection) in
        view.scheduleReport()
      }
    }
    #endif
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    scheduleReport()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    scheduleReport()
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    scheduleReport()
  }

  /// Coalesces the bursts of layout, trait and hinge callbacks a fold or a
  /// rotation produces into one report once layout has settled.
  private func scheduleReport() {
    guard !reportScheduled else { return }
    reportScheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.reportScheduled = false
      self.report()
    }
  }

  private func report() {
    guard let window else { return }
    let payload: NSDictionary = [
      "verticalBarEdge": verticalBarEdge(),
      "hinge": hingeStatus,
      "fold": foldRect(in: window).map { rect -> [String: Double] in
        [
          "x": Double(rect.origin.x), "y": Double(rect.origin.y),
          "width": Double(rect.width), "height": Double(rect.height),
        ]
      } ?? NSNull(),
      "windowWidth": Double(window.bounds.width),
      "windowHeight": Double(window.bounds.height),
    ]
    if payload == lastPayload { return }
    lastPayload = payload
    onDuoLayoutChange(payload as! [String: Any])
  }

  /// "left", "right" or "none", resolved from leading/trailing.
  private func verticalBarEdge() -> String {
    #if os(iOS)
    if #available(iOS 27.1, *) {
      let rtl = effectiveUserInterfaceLayoutDirection == .rightToLeft
      switch traitCollection.verticalBarEdge {
      case .leading: return rtl ? "right" : "left"
      case .trailing: return rtl ? "left" : "right"
      default: return "none"
      }
    }
    #endif
    return "none"
  }

  /// The active division region (the fold while the device is partly open),
  /// or nil. `reservedRegionsOfKind:` is refined for Swift, so it's called
  /// through the Objective-C runtime rather than by a Swift name.
  private func foldRect(in window: UIWindow) -> CGRect? {
    guard #available(iOS 27.1, *) else { return nil }
    let query = NSSelectorFromString("reservedRegionsOfKind:")
    guard
      window.responds(to: query),
      let kindClass = NSClassFromString("UIViewReservedRegionKind") as? NSObject.Type,
      let kind = kindClass.perform(NSSelectorFromString("divisionRegionKind"))?
        .takeUnretainedValue(),
      let regions = window.perform(query, with: kind)?.takeUnretainedValue() as? [NSObject]
    else { return nil }

    for region in regions {
      if let active = region.value(forKey: "active") as? Bool, !active { continue }
      if let frame = (region.value(forKey: "frame") as? NSValue)?.cgRectValue,
        frame.width > 0, frame.height > 0
      {
        return frame
      }
    }
    return nil
  }

  #if os(iOS)
  @available(iOS 27.1, *)
  private static func describe(_ status: UIHinge.Status?) -> String {
    switch status {
    case .closed: return "closed"
    case .partiallyOpen: return "partiallyOpen"
    case .fullyOpen: return "fullyOpen"
    default: return "unknown"
    }
  }
  #endif
}
