import { useState, useEffect, useRef } from "react";

/**
 * useContainerWidth — measures a container's width via ResizeObserver.
 *
 * Returns [ref, width] where ref should be attached to the wrapper element.
 * Falls back to `fallback` until the element is mounted.
 *
 * Usage:
 *   const [containerRef, plotWidth] = useContainerWidth(680);
 *   <div ref={containerRef}>
 *     <ForceGraph width={plotWidth} … />
 *   </div>
 */
export function useContainerWidth(fallback = 680) {
  const ref   = useRef(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set initial width immediately
    setWidth(el.getBoundingClientRect().width || fallback);

    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);

  return [ref, width];
}
