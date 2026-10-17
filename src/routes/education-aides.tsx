import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
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

  useEffect(() => {
    if (!slides || slides.length <= 1) return;

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
  }, [slides?.length, offset]);

  if (!slides || slides.length === 0) {
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
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={idx !== i}
          >
            {s.imageUrl ? (
              <img
                src={assetUrl(s.imageUrl)}
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
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 z-10">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
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
  const listSections = useServerFn(listPublicAidSections);
  const { data: sections } = useSuspenseQuery({
    queryKey: ["public-education-aides"],
    queryFn: () => listSections(),
  });
  const { hero, emptyState } = educationAidesPage;

  return (
    <>
      <PageIntro eyebrow={hero.eyebrow} title={hero.title} description={hero.description} />

      <section className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {sections.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <ImageIcon className="h-10 w-10 text-secondary" aria-hidden="true" />
            <p className="mt-4 text-base font-semibold text-foreground">{emptyState}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10 lg:gap-14">
            {sections.map((s: PublicAidSection, i: number) => (
              <article
                key={s.id}
                className={`grid gap-6 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:gap-8 sm:p-6 md:grid-cols-2 md:items-center lg:gap-10 lg:p-8 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <AutoSlider slides={s.slides} offset={i * 400} />
                <div>
                  <h2 className="font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
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
