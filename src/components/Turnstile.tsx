import { useEffect, useRef, useState } from "react";
import {
  TURNSTILE_BYPASS_TOKEN,
  isTurnstileEnabledClient,
} from "@/lib/turnstile";

export const TURNSTILE_SITE_KEY = "0x4AAAAAAD-YwSGmywvZHGgk";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (code?: string) => void;
          theme?: "auto" | "light" | "dark";
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve()));
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", () => resolve());
    document.head.appendChild(s);
  });
}

type Props = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

/**
 * Turnstile widget — PAUSED. Renders nothing; injects a bypass token so forms still submit.
 * Re-enable by restoring isTurnstileEnabledClient() and mounting this component again.
 */
export function Turnstile({ onVerify, onExpire }: Props) {
  const enabled = isTurnstileEnabledClient();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  useEffect(() => {
    // PAUSED: always provide bypass token for form submit.
    onVerifyRef.current(TURNSTILE_BYPASS_TOKEN);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto",
        callback: (token) => onVerifyRef.current(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": (code?: string) => {
          setErrorCode(code ?? "unknown");
          onExpireRef.current?.();
        },
      });
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [enabled]);

  // PAUSED — do not show Cloudflare widget.
  if (!enabled) return null;

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="min-h-[65px]" />
      {errorCode ? (
        <p className="text-sm text-destructive">
          Security check could not load (error {errorCode}). This usually means this site&apos;s
          domain is not yet allowed in the Turnstile settings.
        </p>
      ) : null}
    </div>
  );
}
