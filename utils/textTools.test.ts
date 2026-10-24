import { htmlToText } from "./textTools";

// Upstream #1306: Jellyfin stores an overview as HTML (jellyfin-web renders it
// as markup), so a biography with links or paragraphs showed its raw tags.
describe("htmlToText", () => {
  test("drops tags and keeps their text", () => {
    expect(
      htmlToText(
        'Born in <b>Ohio</b>. See <a href="https://example.org">her site</a>.',
      ),
    ).toBe("Born in Ohio. See her site.");
  });

  test("turns line breaks and paragraphs into new lines", () => {
    expect(htmlToText("<p>First.</p><p>Second.<br/>Third.</p>")).toBe(
      "First.\n\nSecond.\nThird.",
    );
  });

  test("decodes entities", () => {
    expect(
      htmlToText("Tom &amp; Jerry&nbsp;&#8211; &quot;cat&quot; &lt;3"),
    ).toBe('Tom & Jerry – "cat" <3');
  });

  test("keeps an entity past the last code point as written", () => {
    expect(htmlToText("&#99999999;")).toBe("&#99999999;");
  });

  test("leaves plain text alone, a lone angle bracket included", () => {
    const plain = "Rated 4 < 5 by critics.\nA second line.";
    expect(htmlToText(plain)).toBe(plain);
  });
});
