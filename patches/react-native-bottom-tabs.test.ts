import { readFileSync } from "node:fs";
import { join } from "node:path";

const patch = readFileSync(
  join(__dirname, "react-native-bottom-tabs@1.4.0.patch"),
  "utf8",
);

// Upstream #2234: on an app linked against the iOS 27 SDK, the search screen's
// UISearchController only moves into the tab bar when its tab is a UISearchTab,
// which SwiftUI builds for TabRole.search alone. Mapping the search role to
// .prominent kept the detached button but took the search field out of the bar.
test("keeps the search tab a search tab on iOS 27", () => {
  expect(patch).not.toMatch(/\.prominent/);
});
