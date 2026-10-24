import TrackPlayer, { Event } from "react-native-track-player";
import {
  applyMusicNormalization,
  setMusicNormalizationTrack,
} from "@/services/MusicNormalization";
import { isVideoSessionOpen } from "@/utils/videoSession";

/**
 * A remote command reaches the music player even while a video plays: on iOS
 * the video registers its own handlers on the same command center, and every
 * handler gets the command. The song is paused under the video, so a
 * headphone toggle would start it behind the video.
 */
const unlessVideo =
  <T>(handler: (event: T) => unknown) =>
  (event: T) => {
    if (isVideoSessionOpen()) return;
    return handler(event);
  };

export const PlaybackService = async () => {
  TrackPlayer.addEventListener(
    Event.RemotePlay,
    unlessVideo(() => TrackPlayer.play()),
  );

  TrackPlayer.addEventListener(
    Event.RemotePause,
    unlessVideo(() => TrackPlayer.pause()),
  );

  TrackPlayer.addEventListener(
    Event.RemoteNext,
    unlessVideo(() => TrackPlayer.skipToNext()),
  );

  TrackPlayer.addEventListener(
    Event.RemotePrevious,
    unlessVideo(() => TrackPlayer.skipToPrevious()),
  );

  TrackPlayer.addEventListener(
    Event.RemoteSeek,
    unlessVideo((event: { position: number }) =>
      TrackPlayer.seekTo(event.position),
    ),
  );

  TrackPlayer.addEventListener(
    Event.RemoteStop,
    unlessVideo(() => TrackPlayer.reset()),
  );

  // Volume normalization is driven from here and not from a component: this
  // service lives as long as the player, and Android keeps playing the queue
  // after the app is swiped away and the React tree is gone.
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
    if (event.track) setMusicNormalizationTrack(event.track);
  });

  // After a failure iOS builds a new native player, which starts at full
  // volume, and resuming the same track raises no track change to set it from.
  TrackPlayer.addEventListener(Event.PlaybackState, applyMusicNormalization);
};
