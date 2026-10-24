#if os(iOS)
import SwiftUI
import UIKit

/// iPhone Duo half open: every control on a glass deck over the video's
/// reflection, on the bottom half standing on a table or the right page held
/// like a book. The deck stays up the whole time, since that half has nothing
/// else to show. Its sheen tilts with the phone and glows brighter as the
/// room (the screen) dims.
struct TabletopDeck: View {
	@ObservedObject var viewModel: PlayerViewModel
	@ObservedObject var sheen: PlayerSheenModel
	/// The fold, in this view's coordinate space.
	let fold: CGRect
	let size: CGSize

	private let corner: CGFloat = 28

	/// The fold runs across the screen (on a table) rather than down it.
	private var acrossScreen: Bool { fold.width > fold.height }

	var body: some View {
		if acrossScreen {
			VStack(spacing: 0) {
				Color.clear
					.frame(height: max(0, fold.maxY))
					.allowsHitTesting(false)
				deck(compact: size.width < 500)
					.padding(.horizontal, 16)
					.padding(.top, 14)
				Spacer(minLength: 8)
			}
			.frame(width: size.width, height: size.height, alignment: .top)
		} else {
			HStack(spacing: 0) {
				Color.clear
					.frame(width: max(0, fold.maxX))
					.allowsHitTesting(false)
				deck(compact: size.width - fold.maxX < 500)
					.padding(.horizontal, 16)
					.frame(maxHeight: .infinity)
			}
			.frame(width: size.width, height: size.height, alignment: .leading)
		}
	}

	private func deck(compact: Bool) -> some View {
		VStack(spacing: 14) {
			PlayerTopBar(viewModel: viewModel, compact: compact)
			PlayerCenterControls(viewModel: viewModel, time: viewModel.time)
			PlayerBottomBar(viewModel: viewModel, time: viewModel.time)
			if !viewModel.controlsLocked {
				if let countdown = viewModel.countdownRemaining, let next = viewModel.nextEpisode {
					NextEpisodeCountdownView(viewModel: viewModel, next: next, remaining: countdown)
				} else if let segment = viewModel.activeSegment, segment.skipMode != "auto" {
					SkipSegmentButton(viewModel: viewModel, segment: segment)
				}
			}
		}
		.padding(.horizontal, 18)
		.padding(.vertical, 16)
		.background { glass }
		.overlay { sheenOverlay }
		.overlay { rim }
		.shadow(color: .black.opacity(0.35), radius: 18, y: 8)
	}

	@ViewBuilder
	private var glass: some View {
		let shape = RoundedRectangle(cornerRadius: corner, style: .continuous)
		if #available(iOS 26.0, *) {
			Color.clear.glassEffect(.regular, in: shape)
		} else {
			shape.fill(.ultraThinMaterial)
		}
	}

	/// A soft band of light across the glass that slides as the phone tilts.
	private var sheenOverlay: some View {
		GeometryReader { geometry in
			let width = geometry.size.width
			LinearGradient(
				colors: [
					.white.opacity(0),
					.white.opacity(0.16 * sheen.intensity),
					.white.opacity(0),
				],
				startPoint: .leading, endPoint: .trailing
			)
			.frame(width: width * 0.55, height: geometry.size.height * 2)
			.rotationEffect(.degrees(-20))
			.offset(
				x: width * 0.22 + CGFloat(sheen.tilt) * width * 0.35,
				y: -geometry.size.height * 0.5
			)
		}
		.blendMode(.plusLighter)
		.clipShape(RoundedRectangle(cornerRadius: corner, style: .continuous))
		.allowsHitTesting(false)
	}

	/// The glass edge catches the light on the side the phone leans toward.
	private var rim: some View {
		RoundedRectangle(cornerRadius: corner, style: .continuous)
			.strokeBorder(
				LinearGradient(
					colors: [
						.white.opacity(0.45 * sheen.intensity),
						.white.opacity(0.06),
					],
					startPoint: UnitPoint(x: 0.5 - sheen.tilt * 0.5, y: 0),
					endPoint: UnitPoint(x: 0.5 + sheen.tilt * 0.5, y: 1)
				),
				lineWidth: 1
			)
			.allowsHitTesting(false)
	}
}

/// Sits over the mirrored video past the fold: blurs it and darkens it away
/// from the fold, so it reads as the picture reflecting off a glossy surface
/// rather than a second copy of it.
final class TabletopReflectionShadeView: UIView {
	private let blur = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
	private let fade = CAGradientLayer()

	/// Darkens toward the bottom (on a table) or the right edge (as a book).
	var fadesDownward = true {
		didSet {
			fade.startPoint = fadesDownward ? CGPoint(x: 0.5, y: 0) : CGPoint(x: 0, y: 0.5)
			fade.endPoint = fadesDownward ? CGPoint(x: 0.5, y: 1) : CGPoint(x: 1, y: 0.5)
		}
	}

	override init(frame: CGRect) {
		super.init(frame: frame)
		addSubview(blur)
		fade.colors = [
			UIColor.black.withAlphaComponent(0.05).cgColor,
			UIColor.black.withAlphaComponent(0.5).cgColor,
			UIColor.black.withAlphaComponent(0.9).cgColor,
		]
		fade.locations = [0, 0.45, 1]
		layer.addSublayer(fade)
	}

	@available(*, unavailable)
	required init?(coder: NSCoder) {
		fatalError("init(coder:) is not supported")
	}

	override func layoutSubviews() {
		super.layoutSubviews()
		CATransaction.begin()
		CATransaction.setDisableActions(true)
		blur.frame = bounds
		fade.frame = bounds
		CATransaction.commit()
	}
}
#endif
