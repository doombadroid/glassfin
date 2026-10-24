#if os(iOS)
import Combine
import CoreMotion
import os
import UIKit

private let duoLog = os.Logger(subsystem: "com.doombadroid.streamyfinnext", category: "duo")

/// iPhone Duo posture for the presented player: where the fold is while the
/// device is partly open, and the hinge angle. Everything here is iOS 27.1
/// API; elsewhere `fold` stays nil and the player keeps its usual layout.
///
/// `fold` is in window coordinates. Held on a table the fold runs across the
/// screen (tabletop); held like a book it runs down it.
final class DuoPostureModel: ObservableObject {
	@Published private(set) var fold: CGRect?
	/// Radians; 0 when closed, π when flat. Nil until the hinge reports.
	@Published private(set) var hingeAngle: Double?

	/// Starts listening for hinge changes on `view`'s hierarchy.
	func attach(to view: UIView, onChange: @escaping () -> Void) {
		guard #available(iOS 27.1, *) else { return }
		let interaction = UIHingeInteraction { [weak self, weak view] _, update in
			guard let self else { return }
			self.hingeAngle = update.hinge.map { Double($0.angle) }
			duoLog.notice(
				"hinge status=\(update.hinge.map { $0.status.rawValue } ?? -1, privacy: .public) angle=\(self.hingeAngle ?? -1, privacy: .public)"
			)
			if let view { self.refresh(in: view) }
			onChange()
		}
		view.addInteraction(interaction)
	}

	/// Re-reads the fold. Call after layout and on hinge updates.
	func refresh(in view: UIView) {
		let next = view.window.flatMap(Self.activeDivisionRegion(in:))
		if next != fold {
			duoLog.notice("fold \(next.map { NSCoder.string(for: $0) } ?? "none", privacy: .public)")
			fold = next
		}
	}

	/// The active division region, in the window's coordinates.
	/// `reservedRegionsOfKind:` is refined for Swift, so it's reached through
	/// the Objective-C runtime instead of by a Swift name that may differ.
	private static func activeDivisionRegion(in window: UIWindow) -> CGRect? {
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
}

/// Drives the tabletop deck's reflective sheen: the highlight slides with the
/// phone's tilt, and it glows stronger as the screen dims. Screen brightness
/// stands in for ambient light, which apps can't read directly: with
/// auto-brightness on it follows the room.
final class PlayerSheenModel: ObservableObject {
	/// -1…1, left/right tilt of the bottom half.
	@Published private(set) var tilt: Double = 0
	/// 0…1 strength of the glow.
	@Published private(set) var intensity: Double = 0.6

	private let motion = CMMotionManager()
	private var brightnessObserver: NSObjectProtocol?

	func start() {
		updateIntensity()
		brightnessObserver = NotificationCenter.default.addObserver(
			forName: UIScreen.brightnessDidChangeNotification, object: nil, queue: .main
		) { [weak self] _ in self?.updateIntensity() }

		guard motion.isDeviceMotionAvailable, !motion.isDeviceMotionActive else { return }
		motion.deviceMotionUpdateInterval = 1.0 / 30.0
		motion.startDeviceMotionUpdates(to: .main) { [weak self] data, _ in
			guard let self, let gravity = data?.gravity else { return }
			// Gravity's x runs ±1 as the phone rolls side to side; ease it so
			// the sheen drifts rather than jitters.
			let target = max(-1, min(1, gravity.x * 1.6))
			self.tilt += (target - self.tilt) * 0.15
		}
	}

	func stop() {
		motion.stopDeviceMotionUpdates()
		if let brightnessObserver {
			NotificationCenter.default.removeObserver(brightnessObserver)
		}
		brightnessObserver = nil
	}

	private func updateIntensity() {
		let brightness = Double(UIScreen.main.brightness)
		intensity = 0.35 + 0.65 * (1 - brightness)
	}

	deinit { stop() }
}
#endif
