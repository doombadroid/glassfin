import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { render, screen } from "@testing-library/react-native";
import type { OptionGroup } from "../PlatformDropdown";
import { SeasonDropdown } from "./SeasonDropdown";

let mockGroups: OptionGroup[] = [];
jest.mock("../PlatformDropdown", () => ({
  PlatformDropdown: ({
    trigger,
    groups,
  }: {
    trigger: React.ReactNode;
    groups: OptionGroup[];
  }) => {
    mockGroups = groups;
    return trigger;
  },
}));
jest.mock("i18next", () => ({
  t: (key: string, opts?: { season?: string }) =>
    opts?.season ? `${key}:${opts.season}` : key,
}));

const SERIES: BaseItemDto = { Id: "s", Type: "Series", Name: "Long runner" };

// 120 seasons, handed over newest first, the way a server can.
const seasons: BaseItemDto[] = Array.from({ length: 120 }, (_, i) => {
  const index = 120 - i;
  return { Id: `season-${index}`, IndexNumber: index, Name: `Season ${index}` };
});

test("a show with 100+ seasons lists every one in order and labels the pick", async () => {
  const before = seasons.map((s) => s.IndexNumber);
  await render(
    <SeasonDropdown
      item={SERIES}
      seasons={seasons}
      state={{ s: 101 }}
      onSelect={() => {}}
    />,
  );

  expect(screen.getByText("Season 101")).toBeTruthy();
  expect(
    screen.getByLabelText("item.glass.choose_season:Season 101"),
  ).toBeTruthy();

  const options = mockGroups[0].options;
  expect(options).toHaveLength(120);
  expect(options[0].label).toBe("Season 1");
  expect(options[119].label).toBe("Season 120");
  expect(options.filter((o) => o.type === "radio" && o.selected)).toHaveLength(
    1,
  );
  // Sorting copies: the query's cached list keeps its order.
  expect(seasons.map((s) => s.IndexNumber)).toEqual(before);
});

test("a named season shows its own name, not its number", async () => {
  await render(
    <SeasonDropdown
      item={SERIES}
      seasons={[{ Id: "sp", IndexNumber: 0, Name: "Specials" }]}
      state={{ s: 0 }}
      onSelect={() => {}}
    />,
  );
  expect(screen.getByText("Specials")).toBeTruthy();
});
