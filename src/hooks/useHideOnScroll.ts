import { useCallback, useRef, useState } from "react";

/**
 * Returns `isHidden` (true when scrolling down) and an `onScroll` handler
 * to attach to a scrollable container. Used to auto-hide secondary headers
 * (e.g. categories, trending tags) on mobile.
 */
export function useHideOnScroll(threshold = 10) {
    const lastScrollTop = useRef(0);
    const [isHidden, setIsHidden] = useState(false);

    const onScroll = useCallback(
        (e: React.UIEvent<HTMLElement>) => {
            const scrollTop = e.currentTarget.scrollTop;
            const delta = scrollTop - lastScrollTop.current;

            if (Math.abs(delta) >= threshold) {
                // Hide when scrolling down past the threshold zone, show when scrolling up
                setIsHidden(delta > 0 && scrollTop > threshold);
                lastScrollTop.current = scrollTop;
            }
        },
        [threshold],
    );

    return { isHidden, onScroll };
}
