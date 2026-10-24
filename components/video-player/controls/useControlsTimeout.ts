import { useCallback, useEffect, useRef } from "react";

interface UseControlsTimeoutProps {
  showControls: boolean;
  isSliding: boolean;
  episodeView: boolean;
  onHideControls: () => void;
  timeout?: number;
  disabled?: boolean;
}

export const useControlsTimeout = ({
  showControls,
  isSliding,
  episodeView,
  onHideControls,
  timeout = 10000,
  disabled = false,
}: UseControlsTimeoutProps) => {
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      if (!disabled && showControls && !isSliding && !episodeView) {
        controlsTimeoutRef.current = setTimeout(() => {
          onHideControls();
        }, timeout);
      }
    };

    resetControlsTimeout();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isSliding, episodeView, timeout, onHideControls, disabled]);

  const keepControlsFor = useCallback(
    (delay: number) => {
      if (disabled || !showControls) return;

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      // Same holds as the effect above: no countdown while scrubbing or with
      // the episode list open (scrolling it is a touch on the player too);
      // the effect starts one again when they end.
      if (isSliding || episodeView) return;
      controlsTimeoutRef.current = setTimeout(() => {
        onHideControls();
      }, delay);
    },
    [disabled, showControls, isSliding, episodeView, onHideControls],
  );

  // Takes no argument on purpose: callers hand it straight to onTouchStart.
  const handleControlsInteraction = useCallback(
    () => keepControlsFor(timeout),
    [keepControlsFor, timeout],
  );

  return {
    handleControlsInteraction,
    keepControlsFor,
  };
};
