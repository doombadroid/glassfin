#if os(iOS)
import SwiftUI

/// What the free half of a half-open iPhone Duo shows. Playback keeps going on
/// the video half whichever page is up, so browsing never pauses the show.
enum DeckPage: Hashable {
	case controls, upNext, chapters
}

extension PlayerViewModel {
	/// Pages worth offering: up next needs another episode, chapters need some.
	func deckPages(includingControls: Bool) -> [DeckPage] {
		var pages: [DeckPage] = includingControls ? [.controls] : []
		if episodeList.count > 1 { pages.append(.upNext) }
		if !chapters.isEmpty { pages.append(.chapters) }
		return pages
	}

	func deckTitle(_ page: DeckPage) -> String {
		switch page {
		case .controls: str("controls", "Controls")
		case .upNext: str("upNext", "Up next")
		case .chapters: str("chapters", "Chapters")
		}
	}
}

/// Glass segmented picker over the deck pages.
struct DeckPagePicker: View {
	@ObservedObject var viewModel: PlayerViewModel
	let pages: [DeckPage]
	@Binding var selection: DeckPage
	let sheen: PlayerSheenModel

	var body: some View {
		GlassCapsule(vertical: false, sheen: sheen) {
			ForEach(pages, id: \.self) { page in
				Button {
					selection = page
				} label: {
					Text(viewModel.deckTitle(page))
						.font(.subheadline.weight(selection == page ? .bold : .regular))
						.foregroundStyle(.white.opacity(selection == page ? 1 : 0.7))
						.padding(.horizontal, 14)
						.frame(minHeight: 40)
						.background {
							if selection == page {
								Capsule().fill(.white.opacity(0.18))
							}
						}
				}
				.buttonStyle(.plain)
				.accessibilityAddTraits(selection == page ? .isSelected : [])
			}
		}
		.fixedSize()
	}
}

/// The season's episodes; picking one swaps the stream in place.
struct DeckEpisodeList: View {
	@ObservedObject var viewModel: PlayerViewModel

	var body: some View {
		ScrollViewReader { proxy in
			ScrollView {
				LazyVStack(alignment: .leading, spacing: 4) {
					ForEach(viewModel.episodeList, id: \.itemId) { episode in
						Button {
							viewModel.selectEpisode(episode)
						} label: {
							EpisodeRow(episode: episode, headers: viewModel.imageHeaders)
								.padding(.horizontal, 6)
								.background(
									RoundedRectangle(cornerRadius: 12)
										.fill(.white.opacity(episode.isCurrent ? 0.1 : 0))
								)
						}
						.buttonStyle(.plain)
						.id(episode.itemId)
					}
				}
			}
			.scrollIndicators(.hidden)
			.onAppear {
				if let current = viewModel.episodeList.first(where: { $0.isCurrent }) {
					proxy.scrollTo(current.itemId, anchor: .center)
				}
			}
		}
	}
}

/// Chapter list; the one playing is marked, and a tap seeks to it.
struct DeckChapterList: View {
	@ObservedObject var viewModel: PlayerViewModel
	/// Observed so the current-chapter mark follows playback.
	@ObservedObject var time: PlaybackTimeModel

	var body: some View {
		let current = viewModel.chapterIndex(at: time.displayPosition)
		ScrollView {
			LazyVStack(alignment: .leading, spacing: 2) {
				ForEach(Array(viewModel.chapters.enumerated()), id: \.offset) { index, chapter in
					Button {
						viewModel.seek(to: chapter.startSec)
					} label: {
						HStack(spacing: 12) {
							Text(formatTime(chapter.startSec))
								.font(.footnote.monospacedDigit())
								.foregroundStyle(.white.opacity(0.6))
								.frame(minWidth: 52, alignment: .leading)
							Text(chapterName(chapter, index: index))
								.font(.subheadline.weight(index == current ? .semibold : .regular))
								.foregroundStyle(.white)
								.lineLimit(1)
							Spacer(minLength: 0)
							if index == current {
								Image(systemName: "speaker.wave.2.fill")
									.font(.caption)
									.foregroundStyle(.white.opacity(0.8))
									.accessibilityHidden(true)
							}
						}
						.padding(.horizontal, 10)
						.frame(minHeight: 44)
						.background(
							RoundedRectangle(cornerRadius: 12)
								.fill(.white.opacity(index == current ? 0.1 : 0))
						)
						.contentShape(Rectangle())
					}
					.buttonStyle(.plain)
					.accessibilityAddTraits(index == current ? .isSelected : [])
				}
			}
		}
		.scrollIndicators(.hidden)
	}

	private func chapterName(_ chapter: ChapterRecord, index: Int) -> String {
		if let name = chapter.name, !name.isEmpty { return name }
		return "\(viewModel.str("chapters", "Chapters")) \(index + 1)"
	}
}

/// Whichever list page is up.
struct DeckList: View {
	@ObservedObject var viewModel: PlayerViewModel
	let page: DeckPage

	var body: some View {
		switch page {
		case .upNext: DeckEpisodeList(viewModel: viewModel)
		case .chapters: DeckChapterList(viewModel: viewModel, time: viewModel.time)
		case .controls: EmptyView()
		}
	}
}
#endif
