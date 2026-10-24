import { act, renderHook } from "@testing-library/react-native";
import { useVolumeAndBrightness } from "./useVolumeAndBrightness";

// Each set call stays pending until the test settles it, the way a busy
// native module answers late.
const mockPendingSets: (() => void)[] = [];
const mockSet = () =>
  new Promise<void>((resolve) => {
    mockPendingSets.push(resolve);
  });

jest.mock("expo-brightness", () => ({
  getBrightnessAsync: async () => 0.5,
  setBrightnessAsync: () => mockSet(),
}));
jest.mock("react-native-volume-manager", () => ({
  getVolume: async () => ({ volume: 0.5 }),
  setVolume: () => mockSet(),
  showNativeVolumeUI: () => {},
}));

const settleSets = async () => {
  await act(async () => {
    for (const resolve of mockPendingSets.splice(0)) resolve();
  });
};

beforeEach(() => {
  mockPendingSets.length = 0;
});

// Upstream #1468: the gesture overlay shows its percentage pill from these
// callbacks and hides it when the drag ends. A set that answered after the end
// put the pill back with nothing left to hide it, so it stayed on screen.
describe("a volume or brightness drag", () => {
  test("reports the brightness it set while the drag lasts", async () => {
    const onBrightnessChange = jest.fn();
    const { result } = await renderHook(() =>
      useVolumeAndBrightness({ onBrightnessChange }),
    );

    await act(() => result.current.startBrightnessDrag(100));
    await act(() => {
      result.current.updateBrightnessDrag(-50);
    });
    await settleSets();

    expect(onBrightnessChange).toHaveBeenCalledWith(70);
  });

  test("says nothing about a brightness set that lands after the drag ended", async () => {
    const onBrightnessChange = jest.fn();
    const { result } = await renderHook(() =>
      useVolumeAndBrightness({ onBrightnessChange }),
    );

    await act(() => result.current.startBrightnessDrag(100));
    await act(() => {
      result.current.updateBrightnessDrag(-50);
      result.current.endBrightnessDrag();
    });
    await settleSets();

    expect(onBrightnessChange).not.toHaveBeenCalled();
  });

  test("says nothing about a volume set that lands after the drag ended", async () => {
    const onVolumeChange = jest.fn();
    const { result } = await renderHook(() =>
      useVolumeAndBrightness({ onVolumeChange }),
    );

    await act(() => result.current.startVolumeDrag(100));
    await act(() => {
      result.current.updateVolumeDrag(-50);
      result.current.endVolumeDrag();
    });
    await settleSets();

    expect(onVolumeChange).not.toHaveBeenCalled();
  });
});
