import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FacultyPortrait } from "@/components/FacultyPortrait";
import { cn } from "@/lib/utils";
import type { PublicFaculty } from "@/lib/faculty.functions";

type FacultySliderProps = {
  faculty: PublicFaculty[];
  /** Auto-advance interval in ms. Set to 0 to disable autoplay. */
  autoplayInterval?: number;
};

export function FacultySlider({ faculty, autoplayInterval = 5000 }: FacultySliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 28,
    slidesToScroll: 1,
  });
  const [selected, setSelected] = React.useState(0);
  const [snaps, setSnaps] = React.useState<number[]>([]);
  const [isHovering, setIsHovering] = React.useState(false);

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = React.useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi || !autoplayInterval || isHovering) return;
    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, autoplayInterval);
    return () => window.clearInterval(id);
  }, [emblaApi, autoplayInterval, isHovering]);

  if (faculty.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex touch-pan-y">
          {faculty.map((f) => (
            <div
              key={f.id}
              className="min-w-0 shrink-0 grow-0 basis-full pl-4 sm:basis-1/2 lg:basis-1/3"
            >
              <div className="flex h-full gap-4 rounded-lg border border-border/70 bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <FacultyPortrait
                  name={f.name}
                  initials={f.initials}
                  photo={f.photoUrl || f.photo}
                  className="h-24"
                />

                <div className="min-w-0">
                  <h3 className="font-serif text-lg font-bold leading-tight">{f.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-secondary">{f.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{f.credentials}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {faculty.length > 1 ? (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous faculty"
            className="absolute -left-4 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 sm:flex md:-left-5"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next faculty"
            className="absolute -right-4 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 sm:flex md:-right-5"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mt-6 flex items-center justify-center gap-2">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === selected}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === selected ? "w-6 bg-secondary" : "w-1.5 bg-border hover:bg-secondary/50",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
