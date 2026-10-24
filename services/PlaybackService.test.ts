type Listener = (event?: unknown) => unknown;

const mockListeners: Record<string, Listener> = {};
const mockPlay = jest.fn(async () => {});
const mockPause = jest.fn(async () => {});
const mockSeekTo = jest.fn(async (_position: number) => {});

// Virtual: the package is installed from git without its built entry point,
// which Metro never needs and Jest cannot resolve.
jest.mock(
  "react-native-track-player",
  () => ({
    __esModule: true,
    default: {
      play: () => mockPlay(),
      pause: () => mockPause(),
      seekTo: (position: number) => mockSeekTo(position),
      skipToNext: async () => {},
      skipToPrevious: async () => {},
      reset: async () => {},
      setVolume: async () => {},
      addEventListener: (event: string, listener: Listener) => {
        mockListeners[event] = listener;
        return { remove: () => {} };
      },
    },
    Event: {
      RemotePlay: "remote-play",
      RemotePause: "remote-pause",
      RemoteNext: "remote-next",
      RemotePrevious: "remote-previous",
      RemoteSeek: "remote-seek",
      RemoteStop: "remote-stop",
      PlaybackActiveTrackChanged: "playback-active-track-changed",
      PlaybackState: "playback-state",
    },
  }),
  { virtual: true },
);

/** A fresh service and video session, listening as they do in the app. */
const startService = async () => {
  jest.resetModules();
  const videoSession: typeof import("@/utils/videoSession") = require("@/utils/videoSession");
  const { PlaybackService } = require("@/services/PlaybackService");
  await PlaybackService();
  return videoSession;
};

beforeEach(() => {
  mockPlay.mockClear();
  mockPause.mockClear();
  mockSeekTo.mockClear();
});

describe("the playback service and a remote control", () => {
  test("plays the music on a headphone play", async () => {
    await startService();

    await mockListeners["remote-play"]();

    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  // Upstream #442. The video registers its own handlers on the same iOS
  // command center, so a headphone toggle reaches the music player too. The
  // song is paused under the video, so the toggle read as "play" and started
  // it behind the video.
  test("leaves a headphone command to the video while one is on screen", async () => {
    const { enterVideoSession } = await startService();
    const leaveVideo = enterVideoSession();

    await mockListeners["remote-play"]();
    await mockListeners["remote-seek"]({ position: 30 });

    expect(mockPlay).not.toHaveBeenCalled();
    expect(mockSeekTo).not.toHaveBeenCalled();

    leaveVideo();
    await mockListeners["remote-play"]();
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });
});
