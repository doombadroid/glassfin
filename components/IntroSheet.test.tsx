import { render } from "@testing-library/react-native";
import { Dimensions } from "react-native";
import { IntroSheet } from "./IntroSheet";

const mockSheetProps: { maxDynamicContentSize?: number }[] = [];

jest.mock("@gorhom/bottom-sheet", () => {
  const React = jest.requireActual("react");
  const { ScrollView } = jest.requireActual("react-native");
  return {
    BottomSheetModal: React.forwardRef(
      (
        props: { children: React.ReactNode; maxDynamicContentSize?: number },
        _ref: unknown,
      ) => {
        mockSheetProps.push(props);
        return props.children;
      },
    ),
    BottomSheetScrollView: ScrollView,
    BottomSheetBackdrop: () => null,
  };
});
jest.mock("@/utils/atoms/settings", () => ({
  useSettings: () => ({
    settings: { sentryEnabled: false },
    updateSettings: () => {},
    pluginSettings: undefined,
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@/hooks/useHaptic", () => ({ useHaptic: () => () => {} }));
const mockDuo = {
  verticalBarEdge: "none",
  hinge: "unknown",
  fold: null as null | object,
};
jest.mock("@/utils/atoms/duoLayout", () => ({
  useDuoLayout: () => mockDuo,
}));
jest.mock("@/hooks/useAppRouter", () => ({
  __esModule: true,
  default: () => ({ push: () => {} }),
}));
jest.mock(
  "react-native-mmkv",
  () => jest.requireActual("@/test-utils/mmkv").mmkvModule,
);
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Upstream #1134: the intro is taller than a small phone (iPhone SE, the
// folded iPhone Duo), and a dynamically sized sheet with no cap grows to the
// whole window, putting the welcome title under the status bar.
test("caps the sheet below the window height", async () => {
  await render(<IntroSheet />);

  const { height } = Dimensions.get("window");
  const cap = mockSheetProps.at(-1)?.maxDynamicContentSize;
  expect(cap).toBeDefined();
  expect(cap).toBeLessThan(height);
});

test("a regular iPhone gets what every iPhone has, not the fold poses", async () => {
  Object.assign(mockDuo, {
    verticalBarEdge: "none",
    hinge: "unknown",
    fold: null,
  });
  const screen = await render(<IntroSheet />);
  expect(screen.getByText("home.intro.inside_title")).toBeTruthy();
  expect(screen.queryByText("home.intro.book_title")).toBeNull();
});

test("iPhone Duo gets the fold poses, even before the hinge first reports", async () => {
  Object.assign(mockDuo, {
    verticalBarEdge: "right",
    hinge: "unknown",
    fold: null,
  });
  const screen = await render(<IntroSheet />);
  expect(screen.getByText("home.intro.book_title")).toBeTruthy();
  expect(screen.queryByText("home.intro.inside_title")).toBeNull();
});
