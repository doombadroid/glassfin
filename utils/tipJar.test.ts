import { tipResultMessageKey } from "@/utils/tipJar";

describe("tipResultMessageKey", () => {
  test("a completed tip thanks the person", () => {
    expect(tipResultMessageKey("thanked")).toEqual({
      kind: "success",
      key: "home.settings.support.thanks",
    });
  });

  test("a tip waiting for approval says so", () => {
    expect(tipResultMessageKey("pending")?.kind).toBe("info");
  });

  test("a cancel shows nothing", () => {
    expect(tipResultMessageKey("cancelled")).toBeNull();
  });

  test("anything else is reported as a failure", () => {
    for (const result of ["unverified", "unavailable", "unknown"] as const) {
      expect(tipResultMessageKey(result)?.kind).toBe("error");
    }
  });
});
