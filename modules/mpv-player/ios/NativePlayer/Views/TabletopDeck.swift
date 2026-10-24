#if os(iOS)
import SwiftUI
import UIKit

/// iPhone Duo half open: every control in glass capsules over the video's
/// reflection, on the bottom half standing on a table or the right page held
/// like a book. They stay up the whole time, since that half has nothing else
/// to show. Their glow tilts with the phone and brightens as the room (the
/// screen) dims.
struct TabletopDeck: View {
	@ObservedObject var viewModel: PlayerViewModel
	/// Not observed here: only the capsules' glow reads its 30 Hz ticks.
	let sheen: PlayerSheenModel
	/// The fold, in this view's coordinate space.
	let fold: CGRect
	let size: CGSize

	/// The fold runs across the screen (on a table) rather than down it.
	private var acrossScreen: Bool { fold.width > fold.height }

	var body: some View {
		if acrossScreen {
			VStack(spacing: 0) {
				Color.clear
					.frame(height: max(0, fold.maxY))
					.allowsHitTesting(false)
				deck
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
				deck
					.padding(.horizontal, 16)
					.frame(maxHeight: .infinity)
			}
			.frame(width: size.width, height: size.height, alignment: .leading)
		}
	}

	/// No panel: the capsules float over the reflection, as on Netflix, and
	/// carry the light-reactive glow themselves.
	private var deck: some View {
		VStack(alignment: .leading, spacing: 16) {
			ViewThatFits(in: .horizontal) {
				HStack(alignment: .center, spacing: 12) {
					NowPlayingBadge(viewModel: viewModel)
					Spacer(minLength: 12)
					actions
				}
				VStack(alignment: .leading, spacing: 12) {
					NowPlayingBadge(viewModel: viewModel)
					actions
				}
			}
			PlayerBottomBar(viewModel: viewModel, time: viewModel.time)
			HStack {
				Spacer(minLength: 0)
				TransportRow(viewModel: viewModel, sheen: sheen)
				Spacer(minLength: 0)
			}
			if let notice = viewModel.skippedSegmentNotice {
				Text(notice)
					.font(.subheadline.weight(.medium))
					.foregroundStyle(.white)
					.frame(maxWidth: .infinity, alignment: .center)
			}
			if !viewModel.controlsLocked {
				if let countdown = viewModel.countdownRemaining, let next = viewModel.nextEpisode {
					NextEpisodeCountdownView(viewModel: viewModel, next: next, remaining: countdown)
				} else if let segment = viewModel.activeSegment, segment.skipMode != "auto" {
					SkipSegmentButton(viewModel: viewModel, segment: segment)
				}
			}
		}
		.padding(.horizontal, 6)
	}

	private var actions: some View {
		GlassCapsule(vertical: false, sheen: sheen) {
			PlayerTopBar(viewModel: viewModel, compact: true, buttonsOnly: true)
		}
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
