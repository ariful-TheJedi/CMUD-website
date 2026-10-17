import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye, Heart } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { aboutPage } from "@/data/about";
import { assetUrl } from "@/lib/assets";

const guideIcons = {
  target: Target,
  eye: Eye,
  heart: Heart,
} as const;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: aboutPage.meta.title },
      { name: "robots", content: "index, follow" },
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
      <section className="flex min-h-[calc(100dvh-65px)] items-center bg-surface text-foreground lg:min-h-[calc(100dvh-110px)]">
        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div>
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="relative mb-2 lg:mb-0">
                <img
                  src={assetUrl(story.image)}
                  alt={story.imageAlt}
                  fetchPriority="high"
                  decoding="async"
                  width={1280}
                  height={896}
                  className="relative aspect-[10/7] w-full rounded-2xl object-cover shadow-[var(--shadow-elegant)]"
                />
                <div className="absolute -bottom-5 left-4 right-4 grid grid-cols-2 divide-x divide-border/70 rounded-xl border border-border/70 bg-card p-4 shadow-[var(--shadow-elegant)] sm:left-8 sm:right-8 sm:p-5">
                  <div className="pr-3 text-center">
                    <p className="font-serif text-2xl font-bold text-foreground sm:text-3xl">2008</p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">Established</p>
                  </div>
                  <div className="pl-3 text-center">
                    <p className="font-serif text-2xl font-bold text-foreground sm:text-3xl">3,400+</p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">Doctors trained</p>
                  </div>
                </div>
              </div>
              <div className="lg:py-6">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                  {hero.eyebrow}
                </p>
                <h1 className="mt-3 max-w-2xl font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {hero.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {hero.description}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="border-t border-border/70 pt-8 sm:pt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              {story.eyebrow}
            </p>
            <h2 className="mt-2 max-w-3xl font-serif text-2xl font-bold leading-snug sm:text-3xl">
              {story.title}
            </h2>
            <div className="mt-4 max-w-4xl space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {story.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container mx-auto px-4 py-10">
          <SectionHeading eyebrow={guides.eyebrow} title={guides.title} align="center" />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {guides.items.map((v) => {
              const Icon = guideIcons[v.icon];
              return (
                <Card
                  key={v.title}
                  className="group relative overflow-hidden border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-secondary" />
                  <CardContent className="flex h-full flex-col p-7">
                    <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-secondary-foreground">
                      <Icon className="h-7 w-7" strokeWidth={2} />
                    </div>
                    <h3 className="mt-5 font-serif text-xl font-bold text-foreground">{v.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container mx-auto px-4 py-10">
          <SectionHeading
            eyebrow={accreditation.eyebrow}
            title={accreditation.title}
            align="center"
          />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {accreditation.items.map((v) => (
              <Card key={v.title} className="border-border/70">
                <CardContent className="p-7 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center">
                    <img
                      src={assetUrl(v.logo)}
                      alt={`${v.title} logo`}
                      className="max-h-24 max-w-24 object-contain"
                    />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold">{v.title}</h3>
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
