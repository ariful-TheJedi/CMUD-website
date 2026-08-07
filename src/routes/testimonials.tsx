import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicTestimonials } from "@/lib/public-content";
import { testimonialsPage } from "@/data/testimonials";

const testimonialsQueryOptions = queryOptions({
  queryKey: ["public-testimonials"],
  queryFn: () => getPublicTestimonials(),
});

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: testimonialsPage.meta.title },
      { name: "description", content: testimonialsPage.meta.description },
      { property: "og:title", content: testimonialsPage.meta.ogTitle },
      { property: "og:description", content: testimonialsPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(testimonialsQueryOptions),
  component: TestimonialsPage,
});

function TestimonialsPage() {
  const { data: res } = useSuspenseQuery(testimonialsQueryOptions);
  const testimonials = res.data;
  const { hero } = testimonialsPage;
  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">
            {hero.title}
          </h1>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <Card key={t.id} className="border-border/70">
              <CardContent className="p-6">
                <Quote className="h-6 w-6 text-secondary" />
                <p className="mt-3 text-base leading-relaxed">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {t.photoUrl ? <AvatarImage src={t.photoUrl} alt={t.name} /> : null}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-serif text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {testimonials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No testimonials yet.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
