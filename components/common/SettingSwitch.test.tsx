import { render, screen } from "@testing-library/react-native";
import { SwitchColors } from "@/constants/Colors";
import { stubReactNative } from "@/test-utils/reactNative";
import { SettingSwitch } from "./SettingSwitch";

// Upstream #1017: with no colours of its own, the Android switch took the
// system theme's, a dark blue knob on a purple track that barely showed.
test("colours the Android switch with the app accent", async () => {
  stubReactNative({ OS: "android" });
  await render(
    <SettingSwitch testID='toggle' value onValueChange={() => {}} />,
  );

  const props = screen.getByTestId("toggle").props;
  expect(props.thumbTintColor).toBe(SwitchColors.thumbOn);
  expect(props.trackTintColor).toBe(SwitchColors.trackOn);
});

test("dims the Android knob when the switch is off", async () => {
  stubReactNative({ OS: "android" });
  await render(
    <SettingSwitch testID='toggle' value={false} onValueChange={() => {}} />,
  );

  const props = screen.getByTestId("toggle").props;
  expect(props.thumbTintColor).toBe(SwitchColors.thumbOff);
  expect(props.trackTintColor).toBe(SwitchColors.trackOff);
});
