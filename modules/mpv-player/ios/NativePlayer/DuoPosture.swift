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
	/// Only a fold that leaves both halves usable (`minPage` each side); one
	/// hugging an edge (mid-rotation, or barely folded) counts as none, so the
	/// controller and the controls always agree on the layout.
	@Published private(set) var fold: CGRect?
	/// Radians; 0 when closed, π when flat. Nil until the hinge reports. Not
	/// published: it ticks continuously while folding, and only the
	/// controller's reflection strength reads it, on the layout pass the
	/// hinge update asks for.
	private(set) var hingeAngle: Double?

	/// The least either half can keep for the half-open layout to apply.
	static let minPage: CGFloat = 80
	/// Active occlusion regions (the cameras), in window coordinates. The
	/// folded iPhone Duo's camera sits in the side strip the player's rail
	/// moves into, so the rail keeps clear of it.
	@Published private(set) var occlusions: [CGRect] = []

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

	/// Re-reads the fold and the cameras. Call after layout and on hinge
	/// updates.
	func refresh(in view: UIView) {
		guard let window = view.window else { return }
		let next = Self.activeRegions(kind: "divisionRegionKind", in: window).first.flatMap {
			Self.usable(fold: $0, in: view.convert(view.bounds, to: nil))
		}
		if next != fold {
			duoLog.notice("fold \(next.map { NSCoder.string(for: $0) } ?? "none", privacy: .public)")
			fold = next
		}
		let cameras = Self.activeRegions(kind: "occlusionRegionKind", in: window)
		if cameras != occlusions {
			duoLog.notice(
				"occlusions \(cameras.map { NSCoder.string(for: $0) }.joined(separator: " "), privacy: .public)"
			)
			occlusions = cameras
		}
	}

	private static func usable(fold: CGRect, in bounds: CGRect) -> CGRect? {
		let acrossScreen = fold.width > fold.height
		let fits =
			acrossScreen
			? fold.minY - bounds.minY > minPage && bounds.maxY - fold.maxY > minPage
			: fold.minX - bounds.minX > minPage && bounds.maxX - fold.maxX > minPage
		return fits ? fold : nil
	}

	/// Active reserved regions of one kind, in the window's coordinates.
	/// `reservedRegionsOfKind:` is refined for Swift, so it's reached through
	/// the Objective-C runtime instead of by a Swift name that may differ.
	private static func activeRegions(kind kindSelector: String, in window: UIWindow) -> [CGRect] {
		guard #available(iOS 27.1, *) else { return [] }
		let query = NSSelectorFromString("reservedRegionsOfKind:")
		guard
			window.responds(to: query),
			let kindClass = NSClassFromString("UIViewReservedRegionKind") as? NSObject.Type,
			let kind = kindClass.perform(NSSelectorFromString(kindSelector))?
				.takeUnretainedValue(),
			let regions = window.perform(query, with: kind)?.takeUnretainedValue() as? [NSObject]
		else { return [] }
		return regions.compactMap { region in
			if let active = region.value(forKey: "active") as? Bool, !active { return nil }
			guard let frame = (region.value(forKey: "frame") as? NSValue)?.cgRectValue,
				frame.width > 0, frame.height > 0
			else { return nil }
			return frame
		}
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

	/// Safe to call again while running.
	func start() {
		guard brightnessObserver == nil else { return }
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
