import * as React from "react";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/lib/home-content";

type HeroSliderProps = {
  slides: HeroSlide[];
  fallbackSrc: string;
  /** Auto-advance interval in ms. Set to 0 to disable autoplay. */
  autoplayInterval?: number;
};

/**
 * Smooth crossfade hero image slider. Falls back to a single static image when
 * there's only one slide. A fade (rather than a horizontal slide) suits a hero
 * banner better — these are unrelated full-bleed photos, not an ordered list, so
 * there's no "next/previous" motion to imply.
 */
export function HeroSlider({ slides, fallbackSrc, autoplayInterval = 5000 }: HeroSliderProps) {
  const items = slides.length > 0 ? slides : [{ imageUrl: "", imageAlt: "" }];
  const [active, setActive] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);

  React.useEffect(() => {
    if (items.length <= 1 || !autoplayInterval || isHovering) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, autoplayInterval);
    return () => window.clearInterval(id);
    // `active` is a dependency so every change — auto or a manual dot click —
    // restarts the timer, giving a full interval before the next auto-advance
    // instead of it potentially jumping again right after a manual pick.
  }, [items.length, autoplayInterval, isHovering, active]);

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {items.map((s, i) => (
        <img
          key={i}
          src={assetUrl(s.imageUrl) || fallbackSrc}
          alt={s.imageAlt || ""}
          width={1600}
          height={1024}
          loading={i === 0 ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out",
            i === active ? "opacity-100" : "opacity-0",
          )}
        />
      ))}

      {items.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "h-1.5 rounded-full shadow-sm transition-all duration-300",
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
