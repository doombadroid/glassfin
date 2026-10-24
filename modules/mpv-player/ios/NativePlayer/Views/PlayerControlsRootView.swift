#if os(iOS)
import Combine
import SwiftUI
import UIKit

/// Root overlay for the presented native player. Flat dark look modeled on
/// the iOS system player: white SF Symbols, gradient scrims, monospaced-digit
/// time labels. Subtitles are burned into the video frames by mpv
/// (avfoundation-composite-osd), so this overlay never has to dodge them.
struct PlayerControlsRootView: View {
	@ObservedObject var viewModel: PlayerViewModel
	/// iPhone Duo hinge and fold (window coordinates).
	@ObservedObject var posture: DuoPostureModel
	/// Not observed here: it ticks at 30 Hz, and only the capsules' glow
	/// (CapsuleSheen) reads it.
	let sheen: PlayerSheenModel
	/// Whether the rail fitted the transport; when not, it rides in the row
	/// by the scrubber. Set by the rail as it lays out.
	@State private var railHoldsTransport = true

	private enum DragAxis { case horizontal, vertical }

	// One gesture session on the background surface: the axis locks on the
	// first movement and sticks for the whole drag (mirror of the JS
	// useGestureDetection).
	@State private var dragAxis: DragAxis?
	@State private var dragOnLeftHalf = false
	@State private var dragStartFraction: Double = 0
	@State private var dragStartLevel: Double = 0
	@State private var bottomBarHeight: CGFloat = 0
	/// A pinch or an engaged 2× hold took over this touch sequence — the drag
	/// must stay dead until the fingers lift, or its accumulated translation
	/// (finger spread / hold drift) would scrub or yank the sliders against a
	/// stale baseline.
	@State private var dragSuppressed = false

	/// Points of vertical travel for a full 0→1 volume/brightness swing.
	private let verticalDragRange: CGFloat = 280

	var body: some View {
		GeometryReader { geometry in
			// Portrait phones can't fit the full top-bar button row — late
			// data pushes (episode list) add buttons after load, so the bar
			// must adapt by width, not by content.
			content(
				size: geometry.size,
				bottomSafeAreaInset: geometry.safeAreaInsets.bottom,
				layout: DuoLayout(
					origin: geometry.frame(in: .global).origin,
					size: geometry.size,
					safeArea: geometry.safeAreaInsets,
					posture: posture
				)
			)
		}
	}

	private func content(size: CGSize, bottomSafeAreaInset: CGFloat, layout: DuoLayout) -> some View {
		ZStack {
			if let fold = layout.halfOpenFold {
				// Half open: video on one half, every control on the other
				// (TabletopDeck), over the video's reflection. Locked, taps
				// only reveal the unlock pill, as they do full screen.
				if viewModel.controlsLocked {
					Color.clear
						.contentShape(Rectangle())
						.onTapGesture { handleSurfaceTap() }
				} else {
					TabletopDeck(viewModel: viewModel, sheen: sheen, fold: fold, size: size)
						.zIndex(1)
					if volumeSliderVisible {
						// A hardware volume press still shows its level.
						HStack {
							Spacer()
							VolumeSliderView(
								viewModel: viewModel,
								controller: viewModel.volumeController
							)
						}
						.padding(.horizontal)
						.transition(.opacity)
						.zIndex(2)
					}
				}
			} else {
				// Tap-to-toggle catcher behind everything interactive; also the
				// gesture surface — controls layered above receive their own
				// touches first, so drags here only start on empty video area.
				tapSurface(size: size)
					.gesture(
						surfaceDragGesture(size: size, bottomSafeAreaInset: bottomSafeAreaInset)
					)
					.gesture(holdSpeedGesture)

				if viewModel.controlsVisible {
					scrims
					// zIndex lifts the bars above the center-controls layer below:
					// the trickplay bubble pops up out of the bottom bar's scrubber
					// and must cover the play/skip buttons in landscape, not duck
					// under them. Hit-testing is unaffected — the layer's empty
					// middle isn't tappable.
					railChrome(layout: layout)
						.transition(.opacity)
						.zIndex(1)
				}
			}

			if viewModel.showSubtitleScaleControl {
				SubtitleScaleOverlay(
					viewModel: viewModel,
					onClose: closeSubtitleScaleControl
				)
				.frame(maxWidth: 360)
				.frame(
					maxHeight: .infinity,
					alignment: viewModel.subtitlesAtTop ? .bottom : .top
				)
				.padding(.vertical, 64)
				.padding(.horizontal, 24)
				.transition(.scale(scale: 0.95).combined(with: .opacity))
				.zIndex(2)
			}

			if viewModel.isBuffering && !viewModel.isScrubbing && viewModel.errorMessage == nil {
				ProgressView()
					.controlSize(.large)
					.tint(.white)
			}

			if layout.halfOpenFold == nil {
				adaptivePlaybackChrome(bottomSafeAreaInset: bottomSafeAreaInset)
					.padding(edgeSet(layout.chromeEdge), layout.contentReserve)

				if viewModel.controlsVisible {
					fullWidthBottomChrome(layout: layout)
						.transition(.opacity)
						.zIndex(1)
				}
			}

			// Hold-to-speed feedback pill; lives outside controlsVisible so it
			// shows over clean video too.
			if viewModel.isHoldSpeedActive {
				VStack {
					HStack(spacing: 5) {
						Text(viewModel.holdSpeedLabel)
							.font(.footnote.weight(.bold).monospacedDigit())
						Image(systemName: "forward.fill")
							.font(.system(size: 11, weight: .semibold))
					}
					.foregroundStyle(.white)
					.padding(.horizontal, 14)
					.padding(.vertical, 8)
					.background(.black.opacity(0.55), in: Capsule())
					Spacer()
				}
				.padding(.top, 24)
				.transition(.opacity)
				.allowsHitTesting(false)
			}

			// Double-tap seek feedback: the numbered seek glyph flashes on the
			// tapped half; lives outside controlsVisible so it shows over
			// clean video too. id(forward) swaps sides via a crossfade instead
			// of sliding the pill across the screen.
			if let forward = viewModel.doubleTapSeekForward {
				HStack {
					if forward { Spacer() }
					Image(
						systemName: seekSymbol(
							prefix: forward ? "goforward" : "gobackward",
							seconds: forward ? viewModel.seekForwardSec : viewModel.seekBackwardSec
						)
					)
					.font(.system(size: 28, weight: .semibold))
					.foregroundStyle(.white)
					.padding(18)
					.background(.black.opacity(0.55), in: Circle())
					if !forward { Spacer() }
				}
				.id(forward)
				.padding(.horizontal, 48)
				.transition(.opacity)
				.allowsHitTesting(false)
			}

			// Lock mode: taps only toggle this transient unlock pill.
			if viewModel.controlsLocked && viewModel.unlockButtonRevealed {
				VStack {
					Button {
						viewModel.unlockControls()
					} label: {
						HStack(spacing: 6) {
							Image(systemName: "lock.open.fill")
								.font(.system(size: 13, weight: .semibold))
							Text(viewModel.str("unlock", "Unlock"))
								.font(.footnote.weight(.semibold))
						}
						.foregroundStyle(.white)
						.padding(.horizontal, 14)
						.padding(.vertical, 9)
						.background(.black.opacity(0.55), in: Capsule())
					}
					Spacer()
				}
				.padding(.top, 24)
				.transition(.opacity)
			}

			if viewModel.showTechnicalInfo {
				VStack {
					HStack {
						TechnicalInfoOverlay(viewModel: viewModel)
						Spacer()
					}
					Spacer()
				}
				.padding(.top, 56)
				.padding(.leading, 24)
			}

			if viewModel.showStillWatching {
				// Above the bars layer (zIndex 1); shown even in lock mode —
				// the video has ended and this is the only way forward.
				StillWatchingOverlay(viewModel: viewModel)
					.transition(.opacity)
					.zIndex(2)
			}

			if let message = viewModel.errorMessage {
				errorOverlay(message: message)
					.zIndex(3)
			}
		}
		// Any touch-down anywhere on the overlay (buttons included — the
		// gesture is simultaneous, so it never steals their taps) re-arms the
		// auto-hide so the chrome can't vanish mid-press.
		.simultaneousGesture(
			DragGesture(minimumDistance: 0)
				.onChanged { _ in viewModel.touchInteractionOccurred() }
		)
		.animation(.easeInOut(duration: 0.2), value: viewModel.showStillWatching)
		.animation(.easeInOut(duration: 0.2), value: viewModel.activeSegment?.startSec)
		.animation(.easeInOut(duration: 0.2), value: viewModel.countdownRemaining != nil)
		.animation(.easeInOut(duration: 0.2), value: viewModel.volumeSliderRevealed)
		.animation(.easeInOut(duration: 0.2), value: viewModel.brightnessSliderRevealed)
		.animation(.easeInOut(duration: 0.2), value: viewModel.unlockButtonRevealed)
		.animation(.easeInOut(duration: 0.15), value: viewModel.isHoldSpeedActive)
		.animation(.easeInOut(duration: 0.15), value: viewModel.showSubtitleScaleControl)
		.animation(.easeInOut(duration: 0.15), value: viewModel.doubleTapSeekForward)
		.onPreferenceChange(BottomBarHeightPreferenceKey.self) { height in
			bottomBarHeight = height
		}
		.animation(.easeInOut(duration: 0.2), value: viewModel.controlsVisible)
		// SwiftUI never delivers onEnded when the SYSTEM cancels the touch
		// (incoming call, Control Center edge swipe, backgrounding) — release
		// an engaged hold here or playback stays stuck at 2×.
		.onReceive(
			NotificationCenter.default.publisher(
				for: UIApplication.willResignActiveNotification
			)
		) { _ in
			viewModel.endHoldSpeed()
		}
		.sheet(isPresented: $viewModel.showEpisodeList) {
			EpisodeListView(viewModel: viewModel)
		}
		.sheet(isPresented: $viewModel.showSyncPlayQueue) {
			SyncPlayQueueView(viewModel: viewModel)
		}
		.sheet(isPresented: $viewModel.showSubtitleSearch) {
			SubtitleSearchView(viewModel: viewModel)
		}
	}

	// MARK: - Surface gestures

	/// The tap catcher. With double-tap-to-seek on, the double tap is
	/// composed exclusively before the single tap, so the toggle waits out
	/// the double-tap window; when off (the default, and in lock mode where
	/// taps must keep revealing the unlock pill instantly) no double tap is
	/// attached at all and the toggle stays immediate.
	@ViewBuilder
	private func tapSurface(size: CGSize) -> some View {
		let surface = Color.clear.contentShape(Rectangle())
		if viewModel.doubleTapToSeekEnabled && !viewModel.controlsLocked
			&& !viewModel.showSubtitleScaleControl {
			surface.gesture(
				SpatialTapGesture(count: 2)
					.onEnded { value in
						viewModel.doubleTapSeek(forward: value.location.x >= size.width / 2)
					}
					.exclusively(
						before: TapGesture().onEnded { handleSurfaceTap() }
					)
			)
		} else {
			surface.onTapGesture { handleSurfaceTap() }
		}
	}

	private func handleSurfaceTap() {
		viewModel.toggleControls()
	}

	/// Press-and-hold anywhere on empty video = 2× until release. The long
	/// press alone ends the moment its duration elapses, so it sequences into
	/// a zero-distance drag that keeps the composite alive until the finger
	/// lifts — onEnded is the release. beginHoldSpeed re-entry-guards itself,
	/// so the repeated onChanged ticks during the drag phase are harmless.
	private var holdSpeedGesture: some Gesture {
		LongPressGesture(minimumDuration: 0.5)
			.sequenced(before: DragGesture(minimumDistance: 0))
			.onChanged { value in
				if case .second = value {
					viewModel.beginHoldSpeed()
				}
			}
			.onEnded { _ in
				viewModel.endHoldSpeed()
			}
	}

	/// Horizontal drag anywhere = scrub (Apple TV app style, through the same
	/// beginScrub/updateScrub/endScrub path as the scrubber, so trickplay,
	/// chapter haptics and pause-while-scrubbing come along). Vertical drag =
	/// brightness on the left half, volume on the right (JS GestureOverlay
	/// parity), with the edge pills transiently revealed as feedback.
	private func surfaceDragGesture(size: CGSize, bottomSafeAreaInset: CGFloat) -> some Gesture {
		DragGesture(minimumDistance: 12)
			.onChanged { value in
				guard !viewModel.controlsLocked,
					!viewModel.showStillWatching,
					viewModel.errorMessage == nil
				else { return }

				// iOS briefly delivers a home-indicator swipe before taking
				// ownership. Ignore the sequence before it changes player state.
				if bottomSafeAreaInset > 0,
					value.startLocation.y >= size.height - bottomSafeAreaInset {
					return
				}

				// A two-finger pinch or an engaged 2× hold owns this touch
				// sequence. Abandon any in-flight drag and ignore the rest;
				// resuming would apply accumulated movement to a stale baseline.
				if viewModel.isPinching || viewModel.isHoldSpeedActive || dragSuppressed {
					if !dragSuppressed {
						dragSuppressed = true
						if dragAxis == .vertical {
							if dragOnLeftHalf {
								viewModel.brightnessController.isUserInteracting = false
							} else {
								viewModel.volumeController.isUserInteracting = false
							}
						}
						dragAxis = nil
					}
					return
				}

				if dragAxis == nil {
					if abs(value.translation.width) >= abs(value.translation.height) {
						guard viewModel.swipeToSeekEnabled else {
							dragSuppressed = true
							return
						}
						dragAxis = .horizontal
						if viewModel.duration > 0 {
							viewModel.showControls()
							viewModel.beginScrub()
							dragStartFraction = viewModel.scrubPosition / viewModel.duration
						}
					} else {
						let onLeftHalf = value.startLocation.x < size.width / 2
						// A side whose swipe is turned off owns nothing: the
						// rest of this drag stays dead until the finger lifts.
						guard onLeftHalf
							? viewModel.brightnessSwipeEnabled
							: viewModel.volumeSwipeEnabled
						else {
							dragSuppressed = true
							return
						}
						dragAxis = .vertical
						dragOnLeftHalf = onLeftHalf
						if dragOnLeftHalf {
							dragStartLevel = viewModel.brightnessController.brightness
							viewModel.brightnessController.isUserInteracting = true
						} else {
							dragStartLevel = viewModel.volumeController.volume
							viewModel.volumeController.isUserInteracting = true
						}
					}
				}

				switch dragAxis {
				case .horizontal:
					guard viewModel.isScrubbing, size.width > 0 else { return }
					viewModel.updateScrub(
						fraction: dragStartFraction + value.translation.width / size.width
					)
				case .vertical:
					let level = dragStartLevel - value.translation.height / verticalDragRange
					if dragOnLeftHalf {
						viewModel.brightnessController.setBrightness(level)
						viewModel.revealBrightnessSliderTransiently()
					} else {
						viewModel.volumeController.setVolume(level)
						viewModel.revealVolumeSliderTransiently()
					}
				case nil:
					break
				}
			}
			.onEnded { _ in
				dragSuppressed = false
				if dragAxis == .horizontal, viewModel.isScrubbing {
					viewModel.endScrub()
				}
				if dragAxis == .vertical {
					if dragOnLeftHalf {
						viewModel.brightnessController.isUserInteracting = false
					} else {
						viewModel.volumeController.isUserInteracting = false
					}
				}
				dragAxis = nil
			}
	}

	private var scrims: some View {
		VStack(spacing: 0) {
			LinearGradient(
				colors: [Color.black.opacity(0.6), Color.black.opacity(0)],
				startPoint: .top, endPoint: .bottom
			)
			.frame(height: 140)
			Spacer()
			LinearGradient(
				colors: [Color.black.opacity(0), Color.black.opacity(0.6)],
				startPoint: .top, endPoint: .bottom
			)
			.frame(height: 160)
		}
		.ignoresSafeArea()
		.allowsHitTesting(false)
	}

	private func closeSubtitleScaleControl() {
		viewModel.showSubtitleScaleControl = false
		viewModel.scheduleAutoHide()
	}

	private func edgeSet(_ edge: HorizontalEdge) -> Edge.Set {
		edge == .leading ? .leading : .trailing
	}

	/// The edge rail: close and menus at the top, transport at the bottom.
	/// With a side strip (the folded iPhone Duo) it sits in the strip, as
	/// Netflix's does, clear of the camera; otherwise on the right, where iOS
	/// puts its own vertical bar.
	private func railChrome(layout: DuoLayout) -> some View {
		HStack(spacing: 0) {
			if layout.chromeEdge == .trailing { Spacer(minLength: 0) }
			PlayerRail(viewModel: viewModel, holdsTransport: $railHoldsTransport)
				.padding(.top, layout.railTopClear)
				.padding(.bottom, layout.railBottomClear)
			if layout.chromeEdge == .leading { Spacer(minLength: 0) }
		}
		.padding(.horizontal, DuoLayout.railMargin)
		.padding(.vertical, 8)
		.offset(x: layout.railOffset)
	}

	private var brightnessSliderVisible: Bool {
		viewModel.showBrightnessSlider
			&& (viewModel.controlsVisible || viewModel.brightnessSliderRevealed)
	}

	private var volumeSliderVisible: Bool {
		viewModel.showVolumeSlider
			&& (viewModel.controlsVisible || viewModel.volumeSliderRevealed)
	}

	private func adaptivePlaybackChrome(bottomSafeAreaInset: CGFloat) -> some View {
		HStack {
			if brightnessSliderVisible {
				BrightnessSliderView(
					viewModel: viewModel,
					controller: viewModel.brightnessController
				)
				.transition(.opacity)
			} else if viewModel.controlsVisible && volumeSliderVisible {
				VolumeSliderView(
					viewModel: viewModel,
					controller: viewModel.volumeController
				)
				.hidden()
				.allowsHitTesting(false)
				.accessibilityHidden(true)
			}

			ZStack {
				bottomChrome(bottomSafeAreaInset: bottomSafeAreaInset)
					.zIndex(1)
			}
			.frame(maxWidth: .infinity, maxHeight: .infinity)

			if volumeSliderVisible {
				VolumeSliderView(
					viewModel: viewModel,
					controller: viewModel.volumeController
				)
				.transition(.opacity)
			} else if viewModel.controlsVisible && brightnessSliderVisible {
				BrightnessSliderView(
					viewModel: viewModel,
					controller: viewModel.brightnessController
				)
				.hidden()
				.allowsHitTesting(false)
				.accessibilityHidden(true)
			}
		}
		.padding(.horizontal)
	}

	private func bottomChrome(bottomSafeAreaInset: CGFloat) -> some View {
		let hiddenControlsBottomPadding: CGFloat? =
			bottomSafeAreaInset > 0 ? bottomSafeAreaInset : nil

		return VStack {
			Spacer()
			HStack(alignment: .bottom) {
				if let notice = viewModel.skippedSegmentNotice {
					Text(notice)
						.font(.subheadline.weight(.medium))
						.foregroundStyle(.white)
						.padding(.horizontal, 16)
						.padding(.vertical, 10)
						.background(.ultraThinMaterial, in: Capsule())
						.overlay(Capsule().stroke(.white.opacity(0.2), lineWidth: 1))
						.transition(.opacity)
				}
				Spacer()
				if !viewModel.controlsLocked {
					if let countdown = viewModel.countdownRemaining, let next = viewModel.nextEpisode {
						NextEpisodeCountdownView(
							viewModel: viewModel, next: next, remaining: countdown
						)
					} else if let segment = viewModel.activeSegment, segment.skipMode != "auto" {
						SkipSegmentButton(viewModel: viewModel, segment: segment)
					}
				}
			}
		}
		.padding(
			.bottom,
			viewModel.controlsVisible ? bottomBarHeight : hiddenControlsBottomPadding
		)
	}

	/// Bottom-left: the title badge, the current chapter and the scrubber,
	/// beside the rail. When the rail couldn't fit the transport it sits by
	/// the badge, or under it when the width runs out.
	private func fullWidthBottomChrome(layout: DuoLayout) -> some View {
		VStack(spacing: 0) {
			Spacer()
			VStack(alignment: .leading, spacing: 8) {
				if railHoldsTransport {
					NowPlayingBadge(viewModel: viewModel)
				} else {
					ViewThatFits(in: .horizontal) {
						HStack(alignment: .center) {
							NowPlayingBadge(viewModel: viewModel)
							Spacer(minLength: 12)
							TransportRow(viewModel: viewModel)
						}
						VStack(alignment: .leading, spacing: 10) {
							NowPlayingBadge(viewModel: viewModel)
							HStack {
								Spacer(minLength: 0)
								TransportRow(viewModel: viewModel)
								Spacer(minLength: 0)
							}
						}
					}
				}
				CurrentChapterLabel(viewModel: viewModel, time: viewModel.time)
				PlayerBottomBar(viewModel: viewModel, time: viewModel.time)
			}
			.background {
				GeometryReader { geometry in
					Color.clear.preference(
						key: BottomBarHeightPreferenceKey.self,
						value: geometry.size.height
					)
				}
			}
		}
		.padding(.horizontal)
		.padding(edgeSet(layout.chromeEdge), layout.contentReserve)
	}

	private func errorOverlay(message: String) -> some View {
		VStack(spacing: 16) {
			Image(systemName: "exclamationmark.triangle.fill")
				.font(.system(size: 40))
				.foregroundStyle(.yellow)
			Text(viewModel.str("playbackError", "Playback error"))
				.font(.headline)
				.foregroundStyle(.white)
			Text(message)
				.font(.footnote)
				.foregroundStyle(.white.opacity(0.8))
				.multilineTextAlignment(.center)
				.lineLimit(4)
			Button {
				viewModel.dismissError()
			} label: {
				Text(viewModel.str("close", "Close"))
					.font(.headline)
					.padding(.horizontal, 28)
					.padding(.vertical, 10)
					.background(.white.opacity(0.2), in: Capsule())
					.foregroundStyle(.white)
			}
		}
		.padding(32)
		.frame(maxWidth: 420)
		.background(.black.opacity(0.85), in: RoundedRectangle(cornerRadius: 20))
	}
}

/// The iPhone Duo posture, in the root view's own coordinates (the safe
/// area's), and where the controls rail goes.
private struct DuoLayout {
	/// The fold while half open: across the screen on a table, down it held
	/// like a book.
	let halfOpenFold: CGRect?
	/// Folded, the system's side strip leaves one side's inset much bigger
	/// than the other's; the rail runs down that side.
	let railEdge: HorizontalEdge?
	/// The side the rail runs down: the strip's when there is one, else the
	/// right, where iOS puts its own vertical bar.
	var chromeEdge: HorizontalEdge { railEdge ?? .trailing }
	/// How far the rail moves sideways from its place inside the safe area:
	/// into the middle of the strip when there's one wide enough for it.
	let railOffset: CGFloat
	/// Room the rail keeps above and below itself for the camera in the strip.
	let railTopClear: CGFloat
	let railBottomClear: CGFloat
	/// Room the content (sliders, badge, scrubber) leaves on the rail's side:
	/// the rail's width when the rail sits over the content, none when it sits
	/// out in the strip.
	let contentReserve: CGFloat

	/// Gap between the rail and the safe area's edge.
	static let railMargin: CGFloat = 12
	/// A 44pt button plus the capsule's 4pt padding each side.
	private static let railWidth: CGFloat = 52
	/// A side inset at least this much bigger than the other one means a
	/// strip on that edge, not a notch both sides share.
	private static let railMinAsymmetry: CGFloat = 20

	init(origin: CGPoint, size: CGSize, safeArea: EdgeInsets, posture: DuoPostureModel) {
		let local = { (rect: CGRect) in rect.offsetBy(dx: -origin.x, dy: -origin.y) }
		halfOpenFold = posture.fold.map(local)

		let difference = safeArea.trailing - safeArea.leading
		let edge: HorizontalEdge? =
			halfOpenFold == nil && abs(difference) >= Self.railMinAsymmetry
			? (difference > 0 ? .trailing : .leading)
			: nil
		railEdge = edge

		let stripWidth: CGFloat =
			edge == .trailing ? safeArea.trailing : edge == .leading ? safeArea.leading : 0
		guard let edge, stripWidth >= Self.railWidth + 8 else {
			railOffset = 0
			railTopClear = 0
			railBottomClear = 0
			contentReserve = Self.railMargin + Self.railWidth + 8
			return
		}

		// From railMargin inside the safe area's edge to the strip's middle.
		let shift = stripWidth / 2 + Self.railMargin + Self.railWidth / 2
		railOffset = edge == .trailing ? shift : -shift
		contentReserve = 0

		// Keep clear of any camera in the strip's column. The rail already
		// sits 8pt in from the top and bottom of the safe area.
		let column = CGRect(
			x: edge == .trailing ? size.width : -stripWidth,
			y: -safeArea.top,
			width: stripWidth,
			height: size.height + safeArea.top + safeArea.bottom
		)
		var top: CGFloat = 0
		var bottom: CGFloat = 0
		for camera in posture.occlusions.map(local) where camera.intersects(column) {
			if camera.midY < size.height / 2 {
				top = max(top, camera.maxY)
			} else {
				bottom = max(bottom, size.height - camera.minY)
			}
		}
		railTopClear = top
		railBottomClear = bottom
	}
}

private struct BottomBarHeightPreferenceKey: PreferenceKey {
	static var defaultValue: CGFloat = 0

	static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
		value = max(value, nextValue())
	}
}

private struct CurrentChapterLabel: View {
	@ObservedObject var viewModel: PlayerViewModel
	@ObservedObject var time: PlaybackTimeModel

	var body: some View {
		if let chapterName = viewModel.chapterName(at: time.displayPosition) {
			Text(chapterName)
				.font(.caption)
				.foregroundStyle(.white.opacity(0.7))
				.lineLimit(1)
		}
	}
}

private struct SubtitleScaleOverlay: View {
	@ObservedObject var viewModel: PlayerViewModel
	let onClose: () -> Void

	var body: some View {
		Group {
			#if os(iOS)
			if #available(iOS 26.0, *) {
				content.glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
			} else {
				materialContent
			}
			#else
			materialContent
			#endif
		}
		.shadow(color: .black.opacity(0.25), radius: 12, y: 4)
	}

	private var content: some View {
		VStack(spacing: 12) {
			HStack {
				Text(viewModel.str("subtitleSize", "Subtitle size"))
					.font(.headline)
				Spacer()
				Text(String(format: "%.1f×", viewModel.subtitleScale))
					.font(.subheadline.monospacedDigit())
					.foregroundStyle(.white.opacity(0.75))
				Button(action: onClose) {
					Image(systemName: "xmark.circle.fill")
						.font(.title3)
						.foregroundStyle(.white.opacity(0.75))
						.frame(width: 32, height: 32)
				}
				.buttonStyle(.plain)
				.accessibilityLabel(viewModel.str("close", "Close"))
			}

			Slider(
				value: Binding(
					get: { viewModel.subtitleScale },
					set: { viewModel.setSubtitleScale($0) }
				),
				in: 0.1 ... 3,
				step: 0.1,
				label: { Text(viewModel.str("subtitleSize", "Subtitle size")) },
				minimumValueLabel: { Text("A").font(.caption2) },
				maximumValueLabel: { Text("A").font(.title3) }
			)
			.tint(.white)
			.disabled(viewModel.subtitleScaleLocked)
			.accessibilityValue(Text(String(format: "%.1f×", viewModel.subtitleScale)))
		}
		.foregroundStyle(.white)
		.padding(16)
	}

	private var materialContent: some View {
		content.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
	}
}

/// Bottom bar: the custom scrubber, then time labels with the wall-clock
/// finish time under the remaining time (JS TimeDisplay). The root overlay
/// positions the current chapter relative to this scrubber's anchor.
struct PlayerBottomBar: View {
	@ObservedObject var viewModel: PlayerViewModel
	/// The fast clock — time labels and the chapter caption tick off this.
	@ObservedObject var time: PlaybackTimeModel

	private static let endsAtFormatter: DateFormatter = {
		let formatter = DateFormatter()
		// The JS player renders hour12:false 2-digit — a fixed 24h format.
		formatter.dateFormat = "HH:mm"
		return formatter
	}()

	var body: some View {
		let position = viewModel.isScrubbing ? viewModel.scrubPosition : time.displayPosition
		let remaining = max(0, viewModel.duration - position)

		VStack(alignment: .leading, spacing: 6) {
			ScrubberView(viewModel: viewModel, time: time)
			HStack(alignment: .top) {
				Text(formatTime(position))
				Spacer()
				VStack(alignment: .trailing, spacing: 1) {
					Text("-" + formatTime(remaining))
					if viewModel.duration > 0 {
						Text(endsAtLabel(remaining: remaining))
							.font(.system(size: 10).monospacedDigit())
							.foregroundStyle(.white.opacity(0.55))
					}
					if viewModel.sleepTimerMinutes != nil, let end = viewModel.sleepTimerEndDate {
						// TimelineView ticks the label on its own — the
						// countdown must keep moving while paused, when the
						// display-link clock driving this bar is frozen.
						TimelineView(.periodic(from: .now, by: 1)) { context in
							HStack(spacing: 3) {
								Image(systemName: "moon.zzz.fill")
									.font(.system(size: 9))
								Text(formatTime(max(0, end.timeIntervalSince(context.date))))
									.font(.system(size: 10).monospacedDigit())
							}
							.foregroundStyle(.white.opacity(0.55))
						}
					}
				}
			}
			.font(.footnote.monospacedDigit())
			.foregroundStyle(.white.opacity(0.85))
		}
		.padding(.bottom, 8)
	}

	/// Wall-clock finish time. The i18n template carries a %TIME% placeholder;
	/// translations without one (e.g. sv "slutar") get the time appended.
	private func endsAtLabel(remaining: Double) -> String {
		// Real remaining wall time, not speed-adjusted — matches the JS player.
		let time = Self.endsAtFormatter.string(from: Date().addingTimeInterval(remaining))
		let template = viewModel.str("endsAt", "Ends at %TIME%")
		if template.contains("%TIME%") {
			return template.replacingOccurrences(of: "%TIME%", with: time)
		}
		return "\(template) \(time)"
	}
}

// formatTime lives in Views/TimeFormatting.swift (shared with the tvOS UI).
#endif
