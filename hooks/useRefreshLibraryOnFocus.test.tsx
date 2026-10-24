import { renderHook } from "@testing-library/react-native";
import { emitAppState, stubReactNative } from "@/test-utils/reactNative";
import { useRefreshLibraryOnFocus } from "./useRefreshLibraryOnFocus";

const mockInvalidateQueries = jest.fn();

jest.mock("@/hooks/useNetworkAwareQueryClient", () => ({
  useNetworkAwareQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

// Focused for as long as it is mounted, as the screen under a tab is.
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => undefined | (() => void)) =>
    jest.requireActual("react").useEffect(() => effect(), [effect]),
}));

const THROTTLE_MS = 30_000;
let now = 1_000_000;

beforeEach(() => {
  stubReactNative();
  mockInvalidateQueries.mockClear();
  jest.spyOn(Date, "now").mockImplementation(() => now);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const refreshedKeys = () =>
  mockInvalidateQueries.mock.calls.map(([filters]) => filters.queryKey);

// Upstream #1395 and #1271: the socket is closed in the background and the
// server replays nothing on reconnect, so a home screen left open kept what it
// showed when the app was last used, deleted items included.
test("refreshes the library when the app comes back to the foreground", async () => {
  await renderHook(() => useRefreshLibraryOnFocus(THROTTLE_MS));
  expect(mockInvalidateQueries).not.toHaveBeenCalled();

  now += THROTTLE_MS;
  emitAppState("active");

  expect(refreshedKeys()).toContainEqual(["home"]);
  expect(refreshedKeys()).toContainEqual(["library-items"]);
});

test("a second foreground inside the throttle window refreshes nothing more", async () => {
  await renderHook(() => useRefreshLibraryOnFocus(THROTTLE_MS));
  emitAppState("active");
  const afterFirst = mockInvalidateQueries.mock.calls.length;

  now += THROTTLE_MS - 1;
  emitAppState("active");

  expect(mockInvalidateQueries).toHaveBeenCalledTimes(afterFirst);
});

test("going to the background refreshes nothing", async () => {
  await renderHook(() => useRefreshLibraryOnFocus(THROTTLE_MS));

  emitAppState("background");
  emitAppState("inactive");

  expect(mockInvalidateQueries).not.toHaveBeenCalled();
});

test("a screen that has lost focus no longer refreshes on foreground", async () => {
  const { unmount } = await renderHook(() =>
    useRefreshLibraryOnFocus(THROTTLE_MS),
  );
  await unmount();

  now += THROTTLE_MS;
  emitAppState("active");

  expect(mockInvalidateQueries).not.toHaveBeenCalled();
});
