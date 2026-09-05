import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { CampusMap } from "@/components/CampusMap";
import { Card, CardContent } from "@/components/ui/card";
import { contactPage } from "@/data/contact";

const channelIcons = {
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
  const { hero, campuses, channels, map } = contactPage;

  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto px-4 py-8">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {hero.title}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground md:text-lg">
            {hero.description}
          </p>
        </div>
      </section>

      <section className="container mx-auto space-y-6 px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {campuses.map((campus) => (
            <Card
              key={campus.title}
              className="group relative overflow-hidden border-border/70 bg-card shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[var(--shadow-card)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
              <CardContent className="flex h-full flex-col p-5 md:p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/15 transition-transform duration-300 group-hover:scale-105">
                  <MapPin className="h-6 w-6" strokeWidth={1.8} aria-hidden />
                </div>
                <h2 className="mt-4 font-serif text-xl font-bold leading-snug text-foreground md:text-2xl">
                  {campus.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {campus.address}
                </p>
                <a
                  href={campus.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Open in Google Maps
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => {
            const Icon = channelIcons[channel.icon];
            return (
              <Card
                key={channel.title}
                className="group relative overflow-hidden border-border/70 bg-card shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[var(--shadow-card)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-secondary" />
                <CardContent className="flex h-full flex-col p-5 md:p-6">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-secondary-foreground">
                    <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                  </div>
                  <h2 className="mt-4 font-serif text-xl font-bold text-foreground">{channel.title}</h2>
                  <ul className="mt-2 space-y-1.5">
                    {channel.lines.map((line) => (
                      <li key={`${channel.title}-${line.value}`} className="text-sm leading-relaxed">
                        {"href" in line && line.href ? (
                          <a
                            href={line.href}
                            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                            {...(line.href.startsWith("http")
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                          >
                            {line.value}
                          </a>
                        ) : (
                          <span className="font-medium text-foreground">{line.value}</span>
                        )}
                        {line.label ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {line.label}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {"note" in channel && channel.note ? (
                    <p className="mt-2 text-sm text-muted-foreground">{channel.note}</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {map.eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-xl font-bold md:text-2xl">{map.title}</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground md:text-base">{map.description}</p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <CampusMap points={campuses} />
          </div>
        </div>
      </section>
    </>
  );
}
