import { maskToken } from "@/components/settings/maskToken";

test("shows only the token's last four characters", () => {
  expect(maskToken("68c1b89e856a44c3b128d942e9cb0f2a")).toBe("•••• 0f2a");
  expect(maskToken(undefined)).toBeUndefined();
});
