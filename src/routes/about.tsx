import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye, Heart } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { aboutPage } from "@/data/about";

const guideIcons = {
  target: Target,
  eye: Eye,
  heart: Heart,
} as const;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: aboutPage.meta.title },
      { name: "description", content: aboutPage.meta.description },
      { property: "og:title", content: aboutPage.meta.ogTitle },
      { property: "og:description", content: aboutPage.meta.ogDescription },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { hero, story, guides, accreditation } = aboutPage;

  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto px-4 py-20 md:py-24">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-foreground/80 md:text-lg">{hero.description}</p>
        </div>
      </section>

      <section className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-2 lg:items-center">
        <img
          src={story.image}
          alt={story.imageAlt}
          loading="lazy"
          width={1280}
          height={896}
          className="aspect-[5/4] w-full rounded-2xl object-cover shadow-[var(--shadow-elegant)]"
        />
        <div>
          <SectionHeading eyebrow={story.eyebrow} title={story.title} />
          <div className="mt-6 space-y-4 text-muted-foreground">
            {story.paragraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container mx-auto px-4 py-20">
          <SectionHeading eyebrow={guides.eyebrow} title={guides.title} align="center" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {guides.items.map((v) => {
              const Icon = guideIcons[v.icon];
              return (
                <Card
                  key={v.title}
                  className="group relative overflow-hidden border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-secondary" />
                  <CardContent className="flex h-full flex-col p-8">
                    <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-secondary-foreground">
                      <Icon className="h-7 w-7" strokeWidth={2} />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-bold text-foreground">{v.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{v.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container mx-auto px-4 py-20">
          <SectionHeading
            eyebrow={accreditation.eyebrow}
            title={accreditation.title}
            align="center"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {accreditation.items.map((v) => (
              <Card key={v.title} className="border-border/70">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center">
                    <img
                      src={v.logo}
                      alt={`${v.title} logo`}
                      className="max-h-24 max-w-24 object-contain"
                    />
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-bold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
