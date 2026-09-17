import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { sharedMedia } from "@/data/shared";

const MIN_VISIBLE_MS = 400;
const FADE_MS = 250;

/**
 * Full-screen branded splash shown on every public-page document load
 * (fresh visit, hard reload, or a native fallback navigation) until the
 * app has hydrated. Public pages already ship real SSR'd content, so this
 * exists purely to replace the "blank tab, then a page just appears" gap
 * with something intentional — it never blocks on data, only on hydration.
 */
export function BootSplash() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase("fading"), MIN_VISIBLE_MS);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (phase !== "fading") return;
    const fadeTimer = setTimeout(() => setPhase("gone"), FADE_MS);
    return () => clearTimeout(fadeTimer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-[999] flex flex-col items-center justify-center gap-5 bg-background ease-out motion-reduce:transition-none",
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      style={{ transitionProperty: "opacity", transitionDuration: `${FADE_MS}ms` }}
    >
      <img src={sharedMedia.headerLogo} alt="" className="h-12 w-auto object-contain" />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/15 border-t-primary motion-reduce:animate-none" />
    </div>
  );
}
