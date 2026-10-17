import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowDown, ImageIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/PageIntro";
import {
  listPublicAidSections,
  type AidSlide,
  type PublicAidSection,
} from "@/lib/education-aides.functions";
import { educationAidesPage } from "@/data/education-aides";
import { assetUrl } from "@/lib/assets";

export const Route = createFileRoute("/education-aides")({
  head: () => ({
    meta: [
      { title: educationAidesPage.meta.title },
      { name: "robots", content: "index, follow" },
      { name: "description", content: educationAidesPage.meta.description },
      { property: "og:title", content: educationAidesPage.meta.ogTitle },
      { property: "og:description", content: educationAidesPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["public-education-aides"],
      queryFn: () => listPublicAidSections(),
    }),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-16 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="container mx-auto px-4 py-16">Not found</div>,
  component: EducationAidesPage,
});

const tints = educationAidesPage.tints;

// function AutoSlider({ slides, offset = 0 }: { slides: AidSlide[]; offset?: number }) {
//   const [i, setI] = useState(0);
//   useEffect(() => {
//     if (slides.length <= 1) return;
//     const start = setTimeout(() => {
//       setI((v) => (v + 1) % slides.length);
//     }, 4000 - offset);
//     const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4000);
//     return () => {
//       clearTimeout(start);
//       clearInterval(t);
//     };
//   }, [slides.length, offset]);

//   if (slides.length === 0) {
//     return (
//       <Card className="border-border/70 overflow-hidden">
//         <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/70 to-secondary/50 text-primary-foreground">
//           <ImageIcon className="h-12 w-12 opacity-70" aria-hidden />
//         </div>
//         <div className="p-4">
//           <p className="text-center text-sm font-medium text-foreground/60">
//             {educationAidesPage.imagesComingSoon}
//           </p>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <Card className="border-border/70 overflow-hidden">
//       <div className="relative aspect-[4/3] overflow-hidden">
//         {slides.map((s, idx) => (
//           <div
//             key={s.id}
//             className={`absolute inset-0 transition-opacity duration-700 ${
//               idx === i ? "opacity-100" : "opacity-0"
//             }`}
//             aria-hidden={idx !== i}
//           >
//             {s.imageUrl ? (
//               <img
//                 src={assetUrl(s.imageUrl)}
//                 alt={s.caption}
//                 className="h-full w-full object-cover"
//                 loading="lazy"
//               />
//             ) : (
//               <div
//                 className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${tints[idx % tints.length]} text-primary-foreground`}
//               >
//                 <ImageIcon className="h-12 w-12 opacity-70" aria-hidden />
//               </div>
//             )}
//           </div>
//         ))}
//         {slides.length > 1 ? (
//           <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
//             {slides.map((_, idx) => (
//               <span
//                 key={idx}
//                 className={`h-1.5 rounded-full transition-all ${
//                   idx === i ? "w-6 bg-primary-foreground" : "w-1.5 bg-primary-foreground/50"
//                 }`}
//               />
//             ))}
//           </div>
//         ) : null}
//       </div>
//       {slides[i]?.caption ? (
//         <div className="p-4">
//           <p key={i} className="animate-fade-in text-center text-sm font-medium text-foreground/80">
//             {slides[i].caption}
//           </p>
//         </div>
//       ) : null}
//     </Card>
//   );
// }

export function AutoSlider({ slides, offset = 0 }: { slides: AidSlide[]; offset?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!slides || slides.length <= 1 || paused) return;

    // Slower, smoother interval duration (5.5 seconds) for better UX
    const slideInterval = 5500;

    // Handle initial offset safely without risking negative/instant triggers
    const initialDelay = Math.max(500, slideInterval - (offset % slideInterval));

    const timeout = setTimeout(() => {
      setI((v) => (v + 1) % slides.length);
      
      const interval = setInterval(() => {
        setI((v) => (v + 1) % slides.length);
      }, slideInterval);

      return () => clearInterval(interval);
    }, initialDelay);

    return () => clearTimeout(timeout);
  }, [slides?.length, offset, paused]);

  if (!slides || slides.length === 0) {
    return (
      <Card className="overflow-hidden rounded-2xl border-white/50 bg-white/35 shadow-xl shadow-primary/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/70 to-secondary/50 text-primary-foreground">
          <ImageIcon className="h-12 w-12 opacity-70" aria-hidden />
        </div>
        <div className="p-4">
          <p className="text-center text-sm font-medium text-muted-foreground">
            {educationAidesPage.imagesComingSoon}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden rounded-2xl border-white/60 bg-white/35 shadow-xl shadow-primary/10 backdrop-blur-xl transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/15 dark:border-white/10 dark:bg-white/[0.06]">
      <div
        className="relative aspect-[4/3] overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
        }}
      >
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={idx !== i}
          >
            {s.imageUrl ? (
              <img
                src={assetUrl(s.imageUrl)}
                alt={s.caption}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
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
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-10" aria-label={`Slide ${i + 1} of ${slides.length}`}>
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show image ${idx + 1}${slide.caption ? `: ${slide.caption}` : ""}`}
                aria-current={idx === i ? "true" : undefined}
                onClick={() => setI(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                  idx === i ? "w-7 bg-white" : "w-2.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      {slides[i]?.caption ? (
        <div className="border-t border-white/40 px-4 py-3 dark:border-white/10">
          <p key={i} className="animate-fade-in text-center text-sm font-medium text-foreground/80">
            {slides[i].caption}
          </p>
        </div>
      ) : null}
    </Card>
  );
}




function EducationAidesPage() {
  const listSections = useServerFn(listPublicAidSections);
  const { data: sections } = useSuspenseQuery({
    queryKey: ["public-education-aides"],
    queryFn: () => listSections(),
  });
  const { hero, emptyState } = educationAidesPage;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_15%_0%,color-mix(in_oklab,var(--color-secondary)_20%,transparent),transparent_42%),radial-gradient(ellipse_at_90%_45%,color-mix(in_oklab,var(--color-primary-glow)_24%,transparent),transparent_38%)]">
        <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
        <div className="container relative mx-auto grid gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-white/35 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary shadow-sm backdrop-blur-md dark:bg-white/[0.06]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {hero.eyebrow}
            </div>
            <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-5xl lg:text-6xl">{hero.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{hero.description}</p>
            <a href="#learning-resources" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              Explore the resources <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/30 p-6 shadow-xl shadow-primary/5 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-white/[0.05]">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-secondary">Learning by doing</p>
            <p className="mt-3 font-serif text-2xl font-bold leading-snug text-foreground sm:text-3xl">From the classroom to confident, hands-on practice.</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Explore the spaces, equipment and learning materials that support every step of ultrasound training.</p>
          </div>
        </div>
      </section>

      <section id="learning-resources" className="relative isolate overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-24 -z-10 h-96 w-96 rounded-full bg-primary-glow/10 blur-3xl" />
        {sections.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-white/60 bg-white/30 px-6 py-14 text-center shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
            <ImageIcon className="h-10 w-10 text-secondary" aria-hidden="true" />
            <p className="mt-4 text-base font-semibold text-foreground">{emptyState}</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:gap-10">
            {sections.map((s: PublicAidSection, i: number) => (
              <article
                key={s.id}
                className={`group relative grid gap-6 overflow-hidden rounded-3xl border border-white/60 bg-white/30 p-4 shadow-lg shadow-primary/[0.04] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-xl hover:shadow-primary/10 sm:gap-8 sm:p-6 md:grid-cols-2 md:items-center lg:gap-10 lg:p-8 dark:border-white/10 dark:bg-white/[0.045] ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <AutoSlider slides={s.slides} offset={i * 400} />
                <div className="px-1 py-2 sm:px-2 lg:px-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Resource {String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    {s.title}
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">
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
