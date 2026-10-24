import { act, renderHook, waitFor } from "@testing-library/react-native";
import { JotaiQueryWrapper } from "@/test-utils/queryWrapper";
import { stubReactNative } from "@/test-utils/reactNative";
import { enterVideoSession } from "@/utils/videoSession";
import { useTVThemeMusic } from "./useTVThemeMusic";

/** The one expo-audio player the hook creates, and whether it is sounding. */
const mockPlayer = {
  playing: false,
  isLoaded: true,
  volume: 0,
  loop: false,
  replace: jest.fn(),
  play: jest.fn(() => {
    mockPlayer.playing = true;
  }),
  // On iOS a pause also deactivates the app's audio session 100 ms later,
  // unless another expo-audio player is playing (AudioModule.swift).
  pause: jest.fn(() => {
    mockPlayer.playing = false;
  }),
  remove: jest.fn(() => {
    mockPlayer.playing = false;
  }),
};

jest.mock("expo-audio", () => ({
  createAudioPlayer: () => mockPlayer,
  setAudioModeAsync: async () => undefined,
}));
jest.mock("@jellyfin/sdk/lib/utils/api", () => ({
  getLibraryApi: () => ({
    getThemeSongs: async () => ({ data: { Items: [{ Id: "theme" }] } }),
  }),
}));
jest.mock("@/providers/JellyfinProvider", () => {
  const { atom } = jest.requireActual("jotai");
  return {
    apiAtom: atom({
      basePath: "https://jellyfin.example.com",
      accessToken: "token",
      deviceInfo: { id: "device" },
    }),
    userAtom: atom({ Id: "user" }),
  };
});
jest.mock("@/utils/atoms/settings", () => ({
  useSettings: () => ({ settings: { tvThemeMusicEnabled: true } }),
}));

beforeEach(() => {
  stubReactNative({ OS: "ios", isTV: true });
  mockPlayer.playing = false;
  jest.clearAllMocks();
});

describe("TV theme music", () => {
  // Upstream #1784. Playback opens over the item page, which stays mounted
  // under the player, so the theme went on playing over the video.
  test("stops at once when a video starts over the item page", async () => {
    const { unmount } = await renderHook(() => useTVThemeMusic("item"), {
      wrapper: JotaiQueryWrapper,
    });
    await waitFor(() => expect(mockPlayer.playing).toBe(true));

    let leaveVideo = () => {};
    await act(async () => {
      leaveVideo = enterVideoSession();
    });

    expect(mockPlayer.playing).toBe(false);
    // A pause would let expo-audio deactivate the audio session the video
    // has just started on.
    expect(mockPlayer.pause).not.toHaveBeenCalled();

    leaveVideo();
    unmount();
  });
});
