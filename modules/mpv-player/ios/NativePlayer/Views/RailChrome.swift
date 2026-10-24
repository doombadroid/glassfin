#if os(iOS)
import SwiftUI

/// The player's chrome, after Netflix on iPhone Duo: no top bar and no centre
/// transport over the picture. Controls live in slim glass capsules down one
/// edge (the side the system keeps its own vertical bar on), and the title
/// sits bottom-left with the scrubber. Glass takes its colour from the video
/// behind it.

/// Slim Liquid Glass capsule holding a column (or row) of icon buttons.
/// With a sheen model it also carries the light-reactive glow: a highlight
/// that follows the phone's tilt and strengthens as the screen dims.
struct GlassCapsule<Content: View>: View {
	var vertical = true
	var sheen: PlayerSheenModel?
	@ViewBuilder var content: () -> Content

	var body: some View {
		stack
			.padding(4)
			.background { glass }
			.overlay {
				if let sheen {
					CapsuleSheen(sheen: sheen, vertical: vertical)
				}
			}
	}

	@ViewBuilder
	private var stack: some View {
		if vertical {
			VStack(spacing: 2, content: content)
		} else {
			HStack(spacing: 2, content: content)
		}
	}

	@ViewBuilder
	private var glass: some View {
		if #available(iOS 26.0, *) {
			Color.clear.glassEffect(.regular, in: Capsule())
		} else {
			Capsule()
				.fill(.ultraThinMaterial)
				.overlay(Capsule().strokeBorder(.white.opacity(0.14), lineWidth: 1))
		}
	}
}

/// The glow on a capsule: a soft band sliding along it with the tilt, and an
/// edge that catches the light on the side the phone leans toward.
private struct CapsuleSheen: View {
	@ObservedObject var sheen: PlayerSheenModel
	let vertical: Bool

	var body: some View {
		GeometryReader { geometry in
			let length = vertical ? geometry.size.height : geometry.size.width
			let shift = CGFloat(sheen.tilt) * length * 0.35
			LinearGradient(
				colors: [.white.opacity(0), .white.opacity(0.22 * sheen.intensity), .white.opacity(0)],
				startPoint: vertical ? .top : .leading,
				endPoint: vertical ? .bottom : .trailing
			)
			.frame(
				width: vertical ? geometry.size.width : length * 0.5,
				height: vertical ? length * 0.5 : geometry.size.height
			)
			.offset(
				x: vertical ? 0 : length * 0.25 + shift,
				y: vertical ? length * 0.25 + shift : 0
			)
		}
		.blendMode(.plusLighter)
		.clipShape(Capsule())
		.overlay(
			Capsule().strokeBorder(
				LinearGradient(
					colors: [.white.opacity(0.5 * sheen.intensity), .white.opacity(0.05)],
					startPoint: UnitPoint(x: 0.5 - sheen.tilt * 0.5, y: 0),
					endPoint: UnitPoint(x: 0.5 + sheen.tilt * 0.5, y: 1)
				),
				lineWidth: 1
			)
		)
		.allowsHitTesting(false)
	}
}

/// Previous episode, previous chapter, back, play/pause, forward, next
/// chapter, next episode: the episode and chapter jumps only where they
/// apply. Play is the one filled control, in the app's accent.
struct RailTransport: View {
	@ObservedObject var viewModel: PlayerViewModel
	var vertical = true

	private static let accent = Color(red: 0x8F / 255, green: 0xE6 / 255, blue: 0xCB / 255)

	var body: some View {
		if showsEpisodeJumps {
			button("backward.end") {
				viewModel.playPreviousEpisode()
			}
			.disabled(viewModel.isSyncPlayActive && viewModel.syncPlay?.hasPrevious != true)
			.accessibilityLabel(viewModel.str("previousEpisode", "Previous episode"))
		}

		if hasChapters {
			button("backward") {
				viewModel.goToPreviousChapter()
			}
			.opacity(viewModel.hasPreviousChapter ? 1 : 0.35)
			.disabled(!viewModel.hasPreviousChapter)
			.accessibilityLabel(viewModel.str("previousChapter", "Previous chapter"))
		}

		button(seekSymbol(prefix: "gobackward", seconds: viewModel.seekBackwardSec)) {
			viewModel.seekBackward()
		}
		.accessibilityLabel(viewModel.str("seekBackward", "Back"))

		Button {
			viewModel.togglePlayPause()
		} label: {
			Image(systemName: viewModel.isPlaying ? "pause.fill" : "play.fill")
				.font(.system(size: 17, weight: .bold))
				.foregroundStyle(Color(red: 0.03, green: 0.04, blue: 0.05))
				.frame(width: 40, height: 40)
				.background(Self.accent, in: Circle())
				.frame(width: 44, height: 44)
				.contentShape(Rectangle())
		}
		.opacity(viewModel.isBuffering ? 0.4 : 1)
		.accessibilityLabel(
			viewModel.isPlaying ? viewModel.str("pause", "Pause") : viewModel.str("play", "Play")
		)

		button(seekSymbol(prefix: "goforward", seconds: viewModel.seekForwardSec)) {
			viewModel.seekForward()
		}
		.accessibilityLabel(viewModel.str("seekForward", "Forward"))

		if hasChapters {
			button("forward") {
				viewModel.goToNextChapter()
			}
			.opacity(viewModel.hasNextChapter ? 1 : 0.35)
			.disabled(!viewModel.hasNextChapter)
			.accessibilityLabel(viewModel.str("nextChapter", "Next chapter"))
		}

		if showsEpisodeJumps {
			button("forward.end") {
				viewModel.playNextEpisode()
			}
			.opacity(hasNextEpisode ? 1 : 0.35)
			.disabled(!hasNextEpisode)
			.accessibilityLabel(viewModel.str("nextEpisode", "Next episode"))
		}
	}

	/// Same rule as the old centre row: episodes and SyncPlay queues.
	private var showsEpisodeJumps: Bool {
		viewModel.isSyncPlayActive || viewModel.metadata?.isEpisode == true
	}

	private var hasChapters: Bool { !viewModel.chapters.isEmpty }

	private var hasNextEpisode: Bool {
		viewModel.isSyncPlayActive
			? viewModel.syncPlay?.hasNext == true
			: viewModel.nextEpisode != nil
	}

	/// Buttons the transport shows for this item.
	static func buttonCount(viewModel: PlayerViewModel) -> Int {
		var count = 3 // back, play, forward
		if viewModel.isSyncPlayActive || viewModel.metadata?.isEpisode == true { count += 2 }
		if !viewModel.chapters.isEmpty { count += 2 }
		return count
	}

	private func button(_ systemName: String, action: @escaping () -> Void) -> some View {
		Button(action: action) {
			Image(systemName: systemName)
				.font(.system(size: 17, weight: .regular))
				.foregroundStyle(.white)
				.frame(width: 44, height: 44)
				.contentShape(Rectangle())
		}
	}
}

/// Round artwork, then title and subtitle: bottom-left, over the scrubber.
struct NowPlayingBadge: View {
	@ObservedObject var viewModel: PlayerViewModel

	var body: some View {
		HStack(spacing: 10) {
			if let uri = viewModel.metadata?.artworkUri, let url = URL(string: uri) {
				RemoteImage(url: url, headers: viewModel.metadata?.artworkHeaders) {
					Color.white.opacity(0.12)
				}
				.frame(width: 40, height: 40)
				.clipShape(Circle())
				.overlay(Circle().strokeBorder(.white.opacity(0.25), lineWidth: 1))
			}
			PlayerTitleBlock(viewModel: viewModel)
		}
	}
}

/// The edge rail: close and the menus up top, transport at the bottom. When
/// the screen is too short for both (folded, in landscape) the caller leaves
/// the transport out of the rail (`heightWithTransport`) and puts it in a row
/// by the scrubber.
struct PlayerRail: View {
	@ObservedObject var viewModel: PlayerViewModel
	var sheen: PlayerSheenModel?
	let showsTransport: Bool

	var body: some View {
		VStack(spacing: 12) {
			GlassCapsule(sheen: sheen) {
				PlayerTopBar(viewModel: viewModel, compact: true, vertical: true)
			}
			Spacer(minLength: 12)
			if showsTransport {
				GlassCapsule(sheen: sheen) {
					RailTransport(viewModel: viewModel)
				}
			}
		}
	}

	/// Points the rail needs with the transport in it, given the items it
	/// shows. Each button is 44pt; capsules pad 4pt each end; 12pt between.
	static func heightWithTransport(viewModel: PlayerViewModel) -> CGFloat {
		var actions = 2 // close, More
		if viewModel.isSyncPlayActive { actions += 1 }
		if viewModel.engine?.isPictureInPictureSupported() == true { actions += 1 }
		if !viewModel.isSyncPlayActive && !viewModel.episodeList.isEmpty { actions += 1 }
		if !viewModel.audioMenu.isEmpty { actions += 1 }
		if !viewModel.subtitleMenu.isEmpty { actions += 1 }
		let transport = RailTransport.buttonCount(viewModel: viewModel)
		return CGFloat(actions + transport) * 44 + 16 + 12 + 24
	}
}
#endif
