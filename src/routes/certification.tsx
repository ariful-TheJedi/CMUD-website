import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, BadgeCheck, FileCheck2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { certificationPage } from "@/data/certification";

const stepIcons = {
  graduationCap: GraduationCap,
  fileCheck: FileCheck2,
  badgeCheck: BadgeCheck,
  award: Award,
} as const;

export const Route = createFileRoute("/certification")({
  head: () => ({
    meta: [
      { title: certificationPage.meta.title },
      { name: "description", content: certificationPage.meta.description },
      { property: "og:title", content: certificationPage.meta.ogTitle },
      { property: "og:description", content: certificationPage.meta.ogDescription },
    ],
  }),
  component: CertificationPage,
});

function CertificationPage() {
  const { hero, steps, recognition } = certificationPage;

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

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = stepIcons[s.icon];
            return (
              <Card
                key={s.title}
                className="group relative overflow-hidden border-border/70 bg-card shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[var(--shadow-card)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                <CardContent className="flex h-full flex-col p-7 md:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15 transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-8 w-8" strokeWidth={1.8} aria-hidden />
                    </div>
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
                      Step {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-bold leading-snug text-foreground md:text-2xl">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-surface p-8 md:p-12">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">{recognition.title}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{recognition.body}</p>
          <Button asChild className="mt-6">
            <Link to={recognition.ctaTo}>{recognition.ctaLabel}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
