/**
 * Anonymous page-view tracker for public routes.
 * Stores only opaque visitor/session ids in local/session storage — no IP.
 */
import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { trackTrafficDuration, trackTrafficPageView } from "@/lib/traffic.functions";
import { isBotUserAgent } from "@/lib/traffic.shared";

const VISITOR_KEY = "cmud_vid";
const SESSION_KEY = "cmud_sid";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreate(storage: Storage, key: string): string {
  try {
    const existing = storage.getItem(key);
    if (existing && existing.length >= 8) return existing;
    const id = randomId();
    storage.setItem(key, id);
    return id;
  } catch {
    return randomId();
  }
}

function shouldSkipPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api")
  );
}

function readUtm(): { utmSource?: string; utmMedium?: string } {
  if (typeof window === "undefined") return {};
  try {
    const q = new URLSearchParams(window.location.search);
    return {
      utmSource: q.get("utm_source") || undefined,
      utmMedium: q.get("utm_medium") || undefined,
    };
  } catch {
    return {};
  }
}

export function TrafficTracker() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const trackFn = useServerFn(trackTrafficPageView);
  const durationFn = useServerFn(trackTrafficDuration);
  const eventIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldSkipPath(pathname)) return;

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    if (isBotUserAgent(ua)) return;

    let cancelled = false;
    const visitorId = getOrCreate(window.localStorage, VISITOR_KEY);
    const sessionId = getOrCreate(window.sessionStorage, SESSION_KEY);
    const { utmSource, utmMedium } = readUtm();
    startedAtRef.current = Date.now();
    eventIdRef.current = null;

    const flushDuration = (eventId: string | null) => {
      if (!eventId) return;
      const durationMs = Date.now() - startedAtRef.current;
      if (durationMs < 500) return;
      void durationFn({ data: { eventId, durationMs } }).catch(() => {
        /* tracking must never break the app */
      });
    };

    void (async () => {
      try {
        const { eventId } = await trackFn({
          data: {
            sessionId,
            visitorId,
            path: pathname,
            pageTitle: typeof document !== "undefined" ? document.title : "",
            referrer: typeof document !== "undefined" ? document.referrer : "",
            utmSource,
            utmMedium,
            userAgent: ua,
            currentHost: window.location.hostname,
          },
        });
        if (cancelled || !eventId) return;
        eventIdRef.current = eventId;
      } catch {
        /* ignore */
      }
    })();

    const onHide = () => flushDuration(eventIdRef.current);
    const onVis = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);

    const heartbeat = window.setInterval(() => {
      flushDuration(eventIdRef.current);
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
      flushDuration(eventIdRef.current);
    };
  }, [pathname, trackFn, durationFn]);

  return null;
}
