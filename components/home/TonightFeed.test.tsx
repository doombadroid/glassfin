import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { createStore, Provider as JotaiProvider } from "jotai";
import { makeItems } from "@/test-utils/baseItems";
import { makeApi } from "@/test-utils/jellyfinApi";
import { apiAtom, userAtom } from "@/utils/atoms/api";
import { TonightFeed } from "./TonightFeed";

const mockPlayMedia = jest.fn();
const mockPush = jest.fn();
let mockSettingsOverrides: Record<string, unknown> = {};

jest.mock(
  "react-native-mmkv",
  () => jest.requireActual("@/test-utils/mmkv").mmkvModule,
);
jest.mock("@/utils/atoms/api", () => {
  const { atom } = jest.requireActual("jotai");
  return { apiAtom: atom(null), userAtom: atom(null) };
});
// Only the two switches the feed reads; the real module pulls in half the app.
jest.mock("@/utils/atoms/settings", () => ({
  useSettings: () => ({
    settings: {
      mergeNextUpAndContinueWatching: false,
      showHeroCarousel: true,
      ...mockSettingsOverrides,
    },
  }),
}));
jest.mock("@/hooks/usePlayMedia", () => ({
  usePlayMedia: () => mockPlayMedia,
}));
jest.mock("@/hooks/useAppRouter", () => ({
  __esModule: true,
  default: () => ({ push: mockPush }),
}));
jest.mock("expo-router", () => ({ useSegments: () => ["(auth)", "(tabs)"] }));
// The route table is not under test; a card should just ask for its item.
jest.mock("@/components/common/TouchableItemRouter", () => ({
  getItemNavigation: (item: { Id: string }) => ({ itemId: item.Id }),
}));
jest.mock("@/components/common/ServerImage", () => ({ Image: () => null }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

const renderFeed = async (resumeCount: number, nextUpCount: number) => {
  const api = makeApi();
  api.mock
    .onGet(/\/UserItems\/Resume/)
    .reply(200, { Items: makeItems(resumeCount, "Resume", "Movie") });
  api.mock
    .onGet(/\/Shows\/NextUp/)
    .reply(200, { Items: makeItems(nextUpCount, "NextUp", "Episode") });
  const store = createStore();
  store.set(apiAtom, api);
  store.set(userAtom, { Id: "user-1" });
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Number.POSITIVE_INFINITY, retry: false },
    },
  });
  const onLoaded = jest.fn();
  await render(
    <QueryClientProvider client={client}>
      <JotaiProvider store={store}>
        <TonightFeed onLoaded={onLoaded} />
      </JotaiProvider>
    </QueryClientProvider>,
  );
  return { onLoaded };
};

beforeEach(() => {
  mockPlayMedia.mockReset();
  mockPush.mockReset();
  mockSettingsOverrides = {};
});

test("the first item gets the resume card; play resumes it", async () => {
  const { onLoaded } = await renderFeed(2, 1);
  await fireEvent.press(
    await screen.findByLabelText("home.tonight.resume", { exact: false }),
  );
  expect(mockPlayMedia).toHaveBeenCalledWith(
    { itemId: "Resume-0", offline: false },
    { item: expect.objectContaining({ Id: "Resume-0" }) },
  );
  expect(onLoaded).toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText("Resume 0"));
  expect(mockPush).toHaveBeenCalledWith({ itemId: "Resume-0" });
  // The rest of continue watching and next up are rows under it.
  expect(screen.getByText("Resume 1")).toBeTruthy();
  expect(screen.getByText("NextUp series 0")).toBeTruthy();
});

test("caps up next at six rows behind a See all that expands", async () => {
  await renderFeed(5, 5);
  await screen.findByText("Resume 1");
  expect(screen.queryByText("NextUp series 4")).toBeNull();
  await fireEvent.press(screen.getByText("home.tonight.see_all"));
  expect(screen.getByText("NextUp series 4")).toBeTruthy();
});

test("with the resume card switched off every item is a row", async () => {
  mockSettingsOverrides = { showHeroCarousel: false };
  await renderFeed(1, 1);
  expect(await screen.findByText("Resume 0")).toBeTruthy();
  expect(
    screen.queryByLabelText("home.tonight.resume", { exact: false }),
  ).toBeNull();
});
