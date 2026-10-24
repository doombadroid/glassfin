import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { useNetworkAwareQueryClient } from "@/hooks/useNetworkAwareQueryClient";
import { onAppForeground } from "@/utils/onAppForeground";

// Query keys that depend on the set of library items. Kept in sync with the
// LibraryChanged handler in WebSocketProvider.
const LIBRARY_QUERY_KEYS = [
  ["home"],
  ["library-items"],
  ["nextUp-all"],
  ["nextUp"],
  ["resumeItems"],
];

/**
 * Fallback refresh for newly added/removed content and watch progress.
 *
 * The primary path is the server's `LibraryChanged` and `UserDataChanged`
 * WebSocket events (handled in WebSocketProvider). This hook is a safety net
 * for the changes the socket never delivered: it invalidates the
 * library-dependent queries so React Query refetches them
 *
 * - when the screen regains focus, for a change made while it was unfocused;
 * - when the app comes back to the foreground with the screen up. The socket
 *   is closed in the background and the server does not replay what it missed
 *   on reconnect, so a home screen left open showed what was there when the
 *   app was last used (upstream #1395), deleted items included (#1271).
 *
 * Skips the refresh on the very first focus (initial mount already fetches) and
 * throttles to avoid refetch storms when quickly switching tabs.
 */
export function useRefreshLibraryOnFocus(throttleMs = 30_000) {
  const queryClient = useNetworkAwareQueryClient();
  const hasFocusedOnce = useRef(false);
  const lastRefreshRef = useRef(0);

  const refresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < throttleMs) {
      return;
    }
    lastRefreshRef.current = now;

    for (const queryKey of LIBRARY_QUERY_KEYS) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient, throttleMs]);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) {
        refresh();
      } else {
        hasFocusedOnce.current = true;
      }

      return onAppForeground(refresh);
    }, [refresh]),
  );
}
