import type { TipResult } from "@/modules";

/**
 * The toast a finished tip shows, or none: a cancel is the person changing
 * their mind and needs no message.
 */
export const tipResultMessageKey = (
  result: TipResult,
): { kind: "success" | "info" | "error"; key: string } | null => {
  switch (result) {
    case "thanked":
      return { kind: "success", key: "home.settings.support.thanks" };
    case "pending":
      return { kind: "info", key: "home.settings.support.pending" };
    case "cancelled":
      return null;
    default:
      return { kind: "error", key: "home.settings.support.failed" };
  }
};
