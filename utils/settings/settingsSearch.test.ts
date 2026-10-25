import { matchesSettingsQuery } from "./settingsSearch";

const audio = {
  title: "Audio & subtitles",
  keywords: "language captions track",
};

describe("matchesSettingsQuery", () => {
  it("matches everything when the query is empty or blank", () => {
    expect(matchesSettingsQuery(audio, "")).toBe(true);
    expect(matchesSettingsQuery(audio, "   ")).toBe(true);
  });

  it("finds an entry by a word of its title or its keywords, in any case", () => {
    expect(matchesSettingsQuery(audio, "SUBTITLES")).toBe(true);
    expect(matchesSettingsQuery(audio, "captions")).toBe(true);
  });

  it("needs every word of the query, in any order", () => {
    expect(matchesSettingsQuery(audio, "track audio")).toBe(true);
    expect(matchesSettingsQuery(audio, "audio downloads")).toBe(false);
  });

  it("ignores accents on either side", () => {
    expect(matchesSettingsQuery({ title: "Subtítulos" }, "subtitulos")).toBe(
      true,
    );
    expect(matchesSettingsQuery({ title: "Subtitulos" }, "subtítulos")).toBe(
      true,
    );
  });
});
