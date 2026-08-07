import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  listPublicAidSections,
  type AidSlide,
  type PublicAidSection,
} from "@/lib/education-aides.functions";
import { educationAidesPage } from "@/data/education-aides";

const sectionsQuery = queryOptions({
  queryKey: ["public-education-aides"],
  queryFn: () => listPublicAidSections(),
});

export const Route = createFileRoute("/education-aides")({
  head: () => ({
    meta: [
      { title: educationAidesPage.meta.title },
      { name: "description", content: educationAidesPage.meta.description },
      { property: "og:title", content: educationAidesPage.meta.ogTitle },
      { property: "og:description", content: educationAidesPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sectionsQuery),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-16 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="container mx-auto px-4 py-16">Not found</div>,
  component: EducationAidesPage,
});

const tints = educationAidesPage.tints;

function AutoSlider({ slides, offset = 0 }: { slides: AidSlide[]; offset?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length <= 1) return;
    const start = setTimeout(() => {
      setI((v) => (v + 1) % slides.length);
    }, 4000 - offset);
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4000);
    return () => {
      clearTimeout(start);
      clearInterval(t);
    };
  }, [slides.length, offset]);

  if (slides.length === 0) {
    return (
      <Card className="border-border/70 overflow-hidden">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/70 to-secondary/50 text-primary-foreground">
          <ImageIcon className="h-12 w-12 opacity-70" aria-hidden />
        </div>
        <div className="p-4">
          <p className="text-center text-sm font-medium text-foreground/60">
            {educationAidesPage.imagesComingSoon}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={idx !== i}
          >
            {s.imageUrl ? (
              <img
                src={s.imageUrl}
                alt={s.caption}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${tints[idx % tints.length]} text-primary-foreground`}
              >
                <ImageIcon className="h-12 w-12 opacity-70" aria-hidden />
              </div>
            )}
          </div>
        ))}
        {slides.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-6 bg-primary-foreground" : "w-1.5 bg-primary-foreground/50"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      {slides[i]?.caption ? (
        <div className="p-4">
          <p key={i} className="animate-fade-in text-center text-sm font-medium text-foreground/80">
            {slides[i].caption}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

function EducationAidesPage() {
  const { data: sections } = useSuspenseQuery(sectionsQuery);
  const { hero, emptyState } = educationAidesPage;

  return (
    <>
      <section className="bg-[var(--gradient-hero)] text-primary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-foreground/80">{hero.description}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        {sections.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{emptyState}</p>
        ) : (
          <div className="flex flex-col gap-12">
            {sections.map((s: PublicAidSection, i: number) => (
              <article
                key={s.id}
                className={`grid gap-8 md:grid-cols-2 md:items-center ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <AutoSlider slides={s.slides} offset={i * 400} />
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
                    {s.title}
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-base text-foreground/80 md:text-lg">
                    {s.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
