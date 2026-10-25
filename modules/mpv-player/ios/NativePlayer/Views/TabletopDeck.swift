#if os(iOS)
import SwiftUI
import UIKit

/// iPhone Duo half open: glass capsules over the video's reflection. On a
/// table the bottom half pages between the controls, up next and chapters;
/// held like a book the transport sits under the video and the right page
/// browses beside it. Everything stays up, since that half has nothing else
/// to show. The glow tilts with the phone and brightens as the room (the
/// screen) dims.
struct TabletopDeck: View {
	@ObservedObject var viewModel: PlayerViewModel
	/// Not observed here: only the capsules' glow reads its 30 Hz ticks.
	let sheen: PlayerSheenModel
	/// The fold, in this view's coordinate space.
	let fold: CGRect
	let size: CGSize

	/// Which page the free half shows; list pages only appear when there is
	/// something to list.
	@State private var page: DeckPage = .controls

	/// The fold runs across the screen (on a table) rather than down it.
	private var acrossScreen: Bool { fold.width > fold.height }

	var body: some View {
		if acrossScreen {
			tabletop
		} else {
			book
		}
	}

	/// On a table: the bottom half pages between the controls and the lists,
	/// with the transport kept under a list so playback stays in reach.
	private var tabletop: some View {
		let pages = viewModel.deckPages(includingControls: true)
		let shown = pages.contains(page) ? page : .controls
		return VStack(spacing: 0) {
			Color.clear
				.frame(height: max(0, fold.maxY))
				.allowsHitTesting(false)
			VStack(spacing: 12) {
				if pages.count > 1 {
					DeckPagePicker(viewModel: viewModel, pages: pages, selection: $page, sheen: sheen)
				}
				if shown == .controls {
					deck
					Spacer(minLength: 0)
				} else {
					DeckList(viewModel: viewModel, page: shown)
						.frame(maxHeight: .infinity)
					PlayerBottomBar(viewModel: viewModel, time: viewModel.time)
					TransportRow(viewModel: viewModel, sheen: sheen)
				}
			}
			.padding(.horizontal, 16)
			.padding(.top, 14)
			.padding(.bottom, 8)
		}
		.frame(width: size.width, height: size.height, alignment: .top)
	}

	/// Held like a book: the transport sits under the video on the left page
	/// and the right page browses episodes or chapters beside it.
	private var book: some View {
		let pages = viewModel.deckPages(includingControls: false)
		let shown = pages.contains(page) ? page : pages.first
		return HStack(spacing: 0) {
			VStack(alignment: .leading, spacing: 12) {
				Spacer(minLength: 0)
				NowPlayingBadge(viewModel: viewModel)
				PlayerBottomBar(viewModel: viewModel, time: viewModel.time)
				HStack {
					Spacer(minLength: 0)
					TransportRow(viewModel: viewModel, sheen: sheen)
					Spacer(minLength: 0)
				}
			}
			.padding(.horizontal, 20)
			.padding(.bottom, 16)
			.frame(width: max(0, fold.minX))
			Color.clear
				.frame(width: fold.width)
				.allowsHitTesting(false)
			VStack(alignment: .leading, spacing: 12) {
				actions
				if let shown {
					if pages.count > 1 {
						DeckPagePicker(viewModel: viewModel, pages: pages, selection: $page, sheen: sheen)
					}
					DeckList(viewModel: viewModel, page: shown)
						.frame(maxHeight: .infinity)
				} else {
					Spacer(minLength: 0)
				}
				prompts
			}
			.padding(16)
			.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
		}
		.frame(width: size.width, height: size.height, alignment: .leading)
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
			prompts
		}
		.padding(.horizontal, 6)
	}

	/// Skip notices, the skip button and the next-episode countdown.
	@ViewBuilder
	private var prompts: some View {
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
