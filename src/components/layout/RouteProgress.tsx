import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/** Delay before showing the bar, so fast navigations never flash it. */
const SHOW_DELAY_MS = 120;
/** How often the bar creeps toward (but never reaches) 90% while pending. */
const TRICKLE_INTERVAL_MS = 200;
/** How long the completed (100%) bar stays visible before fading out. */
const HIDE_DELAY_MS = 200;

/**
 * Slim top-of-page progress bar for route transitions (à la YouTube/GitHub).
 * Tracks the router's pending state so navigations that trigger loaders give
 * visible feedback instead of the page appearing to do nothing.
 */
export function RouteProgress() {
  const isPending = useRouterState({ select: (s) => s.status === "pending" });
  const [progress, setProgress] = useState(0);
  const [rendered, setRendered] = useState(false);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let trickleTimer: ReturnType<typeof setInterval> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    if (isPending) {
      showTimer = setTimeout(() => {
        setRendered(true);
        setProgress(15);
        trickleTimer = setInterval(() => {
          setProgress((p) => (p < 90 ? p + (90 - p) * 0.15 : p));
        }, TRICKLE_INTERVAL_MS);
      }, SHOW_DELAY_MS);
    } else if (wasPendingRef.current) {
      setProgress(100);
      hideTimer = setTimeout(() => {
        setRendered(false);
        setProgress(0);
      }, HIDE_DELAY_MS);
    }

    wasPendingRef.current = isPending;

    return () => {
      clearTimeout(showTimer);
      clearInterval(trickleTimer);
      clearTimeout(hideTimer);
    };
  }, [isPending]);

  if (!rendered) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100]" aria-hidden="true">
      <div
        className="h-[3px] transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: `${progress}%`,
          opacity: progress > 0 ? 1 : 0,
          backgroundImage: "var(--gradient-accent)",
          boxShadow: "0 0 8px 1px color-mix(in oklab, var(--color-primary-glow) 60%, transparent)",
        }}
      />
    </div>
  );
}
