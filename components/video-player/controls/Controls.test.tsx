import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { JotaiQueryWrapper } from "@/test-utils/queryWrapper";
import { makeSharedValue } from "@/test-utils/reanimated";
import { CONTROLS_CONSTANTS } from "./constants";

// The perf specs' setup mocks the native surface the whole controls tree
// touches, and fakes the timers this spec advances.
require("@/test-utils/perfSetup");

jest.mock(
  "expo-key-event",
  () => jest.requireActual("@/test-utils/playerControlsNative").keyEventModule,
);
jest.mock(
  "react-native-volume-manager",
  () =>
    jest.requireActual("@/test-utils/playerControlsNative").volumeManagerModule,
);
jest.mock(
  "react-native-awesome-slider",
  () => jest.requireActual("@/test-utils/playerControlsNative").sliderModule,
);
jest.mock("@/components/video-player/controls/contexts/VideoContext", () => ({
  useVideoContext: () => ({ subtitleTracks: [], audioTracks: [] }),
}));
jest.mock("@/components/video-player/controls/contexts/PlayerContext", () => ({
  usePlayerContext: () => ({
    playerRef: { current: null },
    item: {},
    mediaSource: null,
    isVideoLoaded: true,
    tracksReady: true,
    downloadedItem: null,
  }),
  usePlayerControls: () => ({
    getSubtitleTracks: async () => null,
    getAudioTracks: async () => null,
    setSubtitleTrack: () => {},
    setAudioTrack: () => {},
    disableSubtitles: () => {},
  }),
}));
jest.mock(
  "@/providers/NetworkStatusProvider",
  () => jest.requireActual("@/test-utils/appProviders").networkStatusModule,
);
jest.mock(
  "@/providers/DownloadProvider",
  () => jest.requireActual("@/test-utils/appProviders").downloadModule,
);
jest.mock(
  "@/providers/GlobalModalProvider",
  () => jest.requireActual("@/test-utils/appProviders").globalModalModule,
);
jest.mock("@/hooks/useOrientation", () => ({
  useOrientation: () => ({ isLandscape: false, orientation: 1 }),
}));

const { Controls } = require("./Controls") as typeof import("./Controls");

const item = {
  Id: "episode-1",
  Name: "Test Episode",
  Type: "Movie",
  RunTimeTicks: 7200 * 10_000_000,
};

const renderControls = async (setShowControls: (shown: boolean) => void) => {
  const props = {
    item,
    mediaSource: { Id: "source-1", RunTimeTicks: item.RunTimeTicks },
    isPlaying: false,
    isBuffering: false,
    showControls: true,
    setShowControls,
    togglePlay: () => {},
    play: () => {},
    pause: () => {},
    seek: () => {},
    progress: makeSharedValue(0),
    isSeeking: makeSharedValue(false),
    cacheProgress: makeSharedValue(0),
  } as unknown as ComponentProps<typeof Controls>;
  await render(<Controls {...props} />, { wrapper: JotaiQueryWrapper });
  await screen.findByText("Test Episode");
};

const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("the player controls", () => {
  // Upstream #1922 and #1750: auto-hide was switched off outright, so the
  // controls an autoplayed episode or a pause brought up stayed on screen.
  test("hide on their own after a while, even while paused", async () => {
    const setShowControls = jest.fn();
    await renderControls(setShowControls);

    await advance(CONTROLS_CONSTANTS.TIMEOUT);

    expect(setShowControls).toHaveBeenCalledWith(false);
  });

  // Upstream #1243: on iOS the playback menu closes with the controls, so
  // opening it buys the longer grace the native player gives its menus.
  test("stay up longer once the playback menu is opened", async () => {
    const setShowControls = jest.fn();
    await renderControls(setShowControls);

    fireEvent(screen.getByTestId("player-menu"), "touchStart");
    await advance(CONTROLS_CONSTANTS.TIMEOUT);
    expect(setShowControls).not.toHaveBeenCalledWith(false);

    await advance(CONTROLS_CONSTANTS.MENU_TIMEOUT);
    expect(setShowControls).toHaveBeenCalledWith(false);
  });
});
