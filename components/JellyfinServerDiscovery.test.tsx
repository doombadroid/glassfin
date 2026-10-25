import { fireEvent, render, screen } from "@testing-library/react-native";
import JellyfinServerDiscovery from "./JellyfinServerDiscovery";

const mockStartDiscovery = jest.fn();
let mockDiscovery = {
  servers: [] as { address: string; port: number; serverName?: string }[],
  isSearching: false,
  startDiscovery: mockStartDiscovery,
};
jest.mock("@/hooks/useJellyfinDiscovery", () => ({
  useJellyfinDiscovery: () => mockDiscovery,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("JellyfinServerDiscovery", () => {
  beforeEach(() => {
    mockStartDiscovery.mockClear();
    mockDiscovery = {
      servers: [],
      isSearching: false,
      startDiscovery: mockStartDiscovery,
    };
  });

  // Discovery is a tap, not a mount effect: the first broadcast raises the
  // iOS Local Network prompt.
  test("searches only when asked", async () => {
    await render(<JellyfinServerDiscovery />);
    expect(mockStartDiscovery).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText("login.glass.find_servers"));

    expect(mockStartDiscovery).toHaveBeenCalledTimes(1);
  });

  test("lists found servers by name and connects to the one picked", async () => {
    mockDiscovery.servers = [
      { address: "http://192.168.1.20:8096", port: 8096, serverName: "Den" },
      { address: "http://192.168.1.30:8096", port: 8096 },
    ];
    const onServerSelect = jest.fn();
    await render(<JellyfinServerDiscovery onServerSelect={onServerSelect} />);

    expect(screen.getByText("login.glass.found")).toBeTruthy();
    // A server that sent no name is listed by its address.
    expect(screen.getByText("http://192.168.1.30:8096")).toBeTruthy();
    await fireEvent.press(screen.getByText("Den"));

    expect(onServerSelect).toHaveBeenCalledWith({
      address: "http://192.168.1.20:8096",
      serverName: "Den",
    });
  });
});
