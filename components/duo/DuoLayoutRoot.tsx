import { useSetAtom } from "jotai";
import { DuoLayoutObserver } from "@/modules";
import { duoLayoutAtom } from "@/utils/atoms/duoLayout";

/** Feeds the native iPhone Duo observer into `duoLayoutAtom`. Mount once. */
export function DuoLayoutRoot() {
  const setLayout = useSetAtom(duoLayoutAtom);
  return <DuoLayoutObserver onChange={setLayout} />;
}
