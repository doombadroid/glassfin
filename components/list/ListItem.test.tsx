import { render, screen } from "@testing-library/react-native";
import { ListItem } from "./ListItem";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Upstream #2272: setting hints are whole sentences (the crash reports one is
// three lines on a phone) and a two line cap cut them off mid sentence.
test("shows a long subtitle in full", async () => {
  const hint =
    "Send anonymous crash and error reports to the Streamyfin developers via Sentry. Reports contain no account data; server addresses and tokens are removed before anything is sent.";
  await render(<ListItem title='Crash reports' subtitle={hint} />);

  expect(screen.getByText(hint).props.numberOfLines).toBeUndefined();
});
