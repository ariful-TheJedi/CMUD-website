import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { contactPage } from "@/data/contact";

const infoIcons = {
  mapPin: MapPin,
  phone: Phone,
  mail: Mail,
  clock: Clock,
} as const;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: contactPage.meta.title },
      { name: "description", content: contactPage.meta.description },
      { property: "og:title", content: contactPage.meta.ogTitle },
      { property: "og:description", content: contactPage.meta.ogDescription },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { hero, info, mapEmbedUrl } = contactPage;

  return (
    <>
      <section className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-foreground/80">{hero.description}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {info.map((i) => {
            const Icon = infoIcons[i.icon];
            return (
              <Card key={i.title} className="border-border/70">
                <CardContent className="p-6">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--gradient-accent)] text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-serif text-lg font-bold">{i.title}</h2>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{i.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border">
          <iframe
            title="CMUD location"
            src={mapEmbedUrl}
            className="h-[420px] w-full"
            loading="lazy"
          />
        </div>
      </section>
    </>
  );
}
