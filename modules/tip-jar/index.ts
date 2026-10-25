import { Platform, requireNativeModule } from "expo-modules-core";

export type TipProduct = { id: string; title: string; price: string };

/** What a tip purchase ended in, as the native module reports it. */
export type TipResult =
  | "thanked"
  | "cancelled"
  | "pending"
  | "unverified"
  | "unavailable"
  | "unknown";

type TipJarNativeModule = {
  products(ids: string[]): Promise<TipProduct[]>;
  purchase(id: string): Promise<TipResult>;
};

// iOS only, and wrapped so a build without the module simply has no tip jar.
const TipJar: TipJarNativeModule | null = (() => {
  if (Platform.OS !== "ios") return null;
  try {
    return requireNativeModule<TipJarNativeModule>("TipJar");
  } catch {
    return null;
  }
})();

/** The tip products App Store Connect knows, cheapest first; none elsewhere. */
export const loadTipProducts = (ids: string[]): Promise<TipProduct[]> =>
  TipJar ? TipJar.products(ids) : Promise.resolve([]);

/** Opens Apple's purchase sheet for one tip. */
export const purchaseTip = (id: string): Promise<TipResult> =>
  TipJar ? TipJar.purchase(id) : Promise.resolve("unavailable");
