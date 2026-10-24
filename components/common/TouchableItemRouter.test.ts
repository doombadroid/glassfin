import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getItemNavigation, itemRouter } from "./TouchableItemRouter";

// Only the two route resolvers are under test, not the pressable around them.
jest.mock("expo-router", () => ({ useSegments: () => [] }));
jest.mock("@/hooks/useAppRouter", () => ({
  __esModule: true,
  default: () => ({ push: () => {} }),
}));
jest.mock("@/hooks/useItemActionSheet", () => ({
  useItemActionSheet: () => () => {},
}));

const studio: BaseItemDto = { Id: "studio-1", Type: "Studio", Name: "Pixar" };

describe("a playlist's route", () => {
  test("opens a music playlist on the music playlist screen", () => {
    const music: BaseItemDto = {
      Id: "pl-1",
      Type: "Playlist",
      MediaType: "Audio",
    };
    expect(getItemNavigation(music, "(libraries)")).toEqual({
      pathname: "/music/playlist/[playlistId]",
      params: { playlistId: "pl-1" },
    });
  });

  // Upstream #1943. Every playlist opened the music screen, which played a
  // movie as audio and downloaded it into the music storage, where the
  // Downloads page never shows it.
  test("opens a playlist of videos as a grid", () => {
    const videos: BaseItemDto = {
      Id: "pl-2",
      Type: "Playlist",
      MediaType: "Video",
    };
    expect(getItemNavigation(videos, "(libraries)")).toEqual({
      pathname: "/[libraryId]",
      params: { libraryId: "pl-2" },
    });
  });
  // Older and mixed playlists can carry no media type, or "Unknown"; they
  // keep the music screen they always opened.
  test.each([undefined, "Unknown"])(
    "keeps a playlist with media type %p on the music screen",
    (mediaType) => {
      const untyped: BaseItemDto = {
        Id: "pl-3",
        Type: "Playlist",
        MediaType: mediaType as BaseItemDto["MediaType"],
      };
      expect(getItemNavigation(untyped, "(libraries)")).toEqual({
        pathname: "/music/playlist/[playlistId]",
        params: { playlistId: "pl-3" },
      });
    },
  );
});

describe("a studio's route", () => {
  // Without its own route a studio fell through to the item page, which has
  // nothing to show for one.
  test("opens the studio's titles rather than an item page", () => {
    expect(getItemNavigation(studio, "(search)")).toEqual({
      pathname: "/studios/[studioId]",
      params: { studioId: "studio-1" },
    });
    expect(itemRouter(studio, "(search)")).toBe(
      "/(auth)/(tabs)/(search)/studios/studio-1",
    );
  });

  test("leaves a person on the person page", () => {
    expect(
      getItemNavigation({ Id: "person-1", Type: "Person" }, "(search)"),
    ).toEqual({
      pathname: "/persons/[personId]",
      params: { personId: "person-1" },
    });
  });
});
