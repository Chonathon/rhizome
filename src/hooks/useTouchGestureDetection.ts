import { useEffect, useRef, useState } from 'react';

/**
 * Hook to detect multi-touch gestures (like pinch-to-zoom) to prevent
 * accidental node interactions during touch gestures.
 *
 * Returns a boolean flag indicating if a multi-touch gesture is currently active.
 * When true, node interaction handlers should be suppressed.
 */
export function useTouchGestureDetection(elementRef: React.RefObject<HTMLElement | null>) {
  const [isMultiTouchActive, setIsMultiTouchActive] = useState(false);
  const touchCountRef = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchCountRef.current = e.touches.length;

      // If more than one touch point, we're in a multi-touch gesture
      if (e.touches.length > 1) {
        setIsMultiTouchActive(true);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchCountRef.current = e.touches.length;

      // When all touches are released, clear the multi-touch state
      if (e.touches.length === 0) {
        setIsMultiTouchActive(false);
      }
    };

    const handleTouchCancel = () => {
      // Touch was cancelled (e.g., too many touches, system gesture)
      touchCountRef.current = 0;
      setIsMultiTouchActive(false);
    };

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [elementRef]);

  return { isMultiTouchActive };
}
