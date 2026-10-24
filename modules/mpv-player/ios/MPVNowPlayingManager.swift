import Foundation
import MediaPlayer
import UIKit
import AVFoundation

/// Simple manager for Now Playing info and remote commands.
/// Stores all state internally and updates Now Playing when ready.
class MPVNowPlayingManager {
    static let shared = MPVNowPlayingManager()
    
    // State
    private var title: String?
    private var artist: String?
    private var albumTitle: String?
    private var cachedArtwork: MPMediaItemArtwork?
    private var duration: TimeInterval = 0
    private var position: TimeInterval = 0
    private var isPlaying: Bool = false
    private var isCommandsSetup = false
    // The targets this manager added. react-native-track-player registers its
    // own on the same shared command center, and removeTarget(nil) would take
    // those too: the music then no longer answered headphones after a video.
    private var commandTargets: [(MPRemoteCommand, Any)] = []
    
    private var artworkTask: URLSessionDataTask?
    
    private init() {}
    
    // MARK: - Remote Commands
    
    func setupRemoteCommands(
        playHandler: @escaping () -> Void,
        pauseHandler: @escaping () -> Void,
        toggleHandler: @escaping () -> Void,
        seekHandler: @escaping (TimeInterval) -> Void,
        skipForward: @escaping (TimeInterval) -> Void,
        skipBackward: @escaping (TimeInterval) -> Void
    ) {
        guard !isCommandsSetup else { return }
        isCommandsSetup = true
        
        DispatchQueue.main.async {
            UIApplication.shared.beginReceivingRemoteControlEvents()
        }
        
        let cc = MPRemoteCommandCenter.shared()
        
        cc.playCommand.isEnabled = true
        addTarget(cc.playCommand) { _ in playHandler(); return .success }
        
        cc.pauseCommand.isEnabled = true
        addTarget(cc.pauseCommand) { _ in pauseHandler(); return .success }
        
        cc.togglePlayPauseCommand.isEnabled = true
        addTarget(cc.togglePlayPauseCommand) { _ in toggleHandler(); return .success }
        
        cc.skipForwardCommand.isEnabled = true
        cc.skipForwardCommand.preferredIntervals = [15]
        addTarget(cc.skipForwardCommand) { e in
            if let ev = e as? MPSkipIntervalCommandEvent { skipForward(ev.interval) }
            return .success
        }
        
        cc.skipBackwardCommand.isEnabled = true
        cc.skipBackwardCommand.preferredIntervals = [15]
        addTarget(cc.skipBackwardCommand) { e in
            if let ev = e as? MPSkipIntervalCommandEvent { skipBackward(ev.interval) }
            return .success
        }
        
        cc.changePlaybackPositionCommand.isEnabled = true
        addTarget(cc.changePlaybackPositionCommand) { e in
            if let ev = e as? MPChangePlaybackPositionCommandEvent { seekHandler(ev.positionTime) }
            return .success
        }
        
        print("[NowPlaying] Remote commands ready")
    }
    
    private func addTarget(
        _ command: MPRemoteCommand,
        handler: @escaping (MPRemoteCommandEvent) -> MPRemoteCommandHandlerStatus
    ) {
        commandTargets.append((command, command.addTarget(handler: handler)))
    }

    func cleanupRemoteCommands() {
        guard isCommandsSetup else { return }

        for (command, target) in commandTargets {
            command.removeTarget(target)
        }
        commandTargets.removeAll()
        
        DispatchQueue.main.async {
            UIApplication.shared.endReceivingRemoteControlEvents()
        }
        
        isCommandsSetup = false
        print("[NowPlaying] Remote commands cleaned up")
    }
    
    // MARK: - State Updates (call these whenever data changes)
    
    /// Set metadata (title, artist, artwork URL)
    func setMetadata(title: String?, artist: String?, albumTitle: String?, artworkUrl: String?, artworkHeaders: [String: String]? = nil) {
        self.title = title
        self.artist = artist
        self.albumTitle = albumTitle
        
        print("[NowPlaying] Metadata: \(title ?? "nil")")
        
        // Load artwork async
        artworkTask?.cancel()
        if let urlString = artworkUrl, let url = URL(string: urlString) {
            var request = URLRequest(url: url)
            artworkHeaders?.forEach { key, value in
                request.setValue(value, forHTTPHeaderField: key)
            }
            artworkTask = URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
                if let data = data, let image = UIImage(data: data) {
                    self?.cachedArtwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                    print("[NowPlaying] Artwork loaded")
                    DispatchQueue.main.async { self?.refresh() }
                }
            }
            artworkTask?.resume()
        }
        
        refresh()
    }
    
    /// Update playback state (position, duration, playing)
    func updatePlayback(position: TimeInterval, duration: TimeInterval, isPlaying: Bool) {
        self.position = position
        self.duration = duration
        self.isPlaying = isPlaying
        refresh()
    }
    
    /// Clear everything
    func clear() {
        artworkTask?.cancel()
        title = nil
        artist = nil
        albumTitle = nil
        cachedArtwork = nil
        duration = 0
        position = 0
        isPlaying = false
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        print("[NowPlaying] Cleared")
    }
    
    // MARK: - Private
    
    /// Refresh Now Playing info if we have enough data
    private func refresh() {
        guard duration > 0 else {
            print("[NowPlaying] refresh skipped - duration is 0")
            return
        }
        
        var info: [String: Any] = [
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: position,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1.0 : 0.0
        ]
        
        if let title { info[MPMediaItemPropertyTitle] = title }
        if let artist { info[MPMediaItemPropertyArtist] = artist }
        if let albumTitle { info[MPMediaItemPropertyAlbumTitle] = albumTitle }
        if let cachedArtwork { info[MPMediaItemPropertyArtwork] = cachedArtwork }
        
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        print("[NowPlaying] ✅ Set info: title=\(title ?? "nil"), dur=\(Int(duration))s, pos=\(Int(position))s, rate=\(isPlaying ? 1.0 : 0.0)")
    }
}
