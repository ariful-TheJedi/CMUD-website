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

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = stepIcons[s.icon];
            return (
              <Card key={s.title} className="border-border/70">
                <CardContent className="p-6">
                  <span className="font-serif text-xs font-bold uppercase tracking-wider text-secondary">
                    Step {i + 1}
                  </span>
                  <div className="mt-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--gradient-accent)] text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-surface p-8 md:p-12">
          <h2 className="font-serif text-2xl font-bold">{recognition.title}</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">{recognition.body}</p>
          <Button asChild className="mt-6">
            <Link to={recognition.ctaTo}>{recognition.ctaLabel}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
