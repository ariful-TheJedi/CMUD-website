import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { CampusMap } from "@/components/CampusMap";
import { Card, CardContent } from "@/components/ui/card";
import { contactPage } from "@/data/contact";

const channelIcons = {
  phone: Phone,
  mail: Mail,
  clock: Clock,
} as const;

const socialIconPaths = {
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.893c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
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
  const { hero, campuses, channels, social, map } = contactPage;

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

          <Card className="group relative overflow-hidden border-border/70 bg-card shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[var(--shadow-card)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-secondary" />
            <CardContent className="flex h-full flex-col p-5 md:p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-secondary-foreground">
                <Share2 className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </div>
              <h2 className="mt-4 font-serif text-xl font-bold text-foreground">Follow us</h2>
              <ul className="mt-2 space-y-1.5">
                {social.map((item) => (
                  <li key={item.label} className="text-sm leading-relaxed">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d={socialIconPaths[item.icon]} />
                      </svg>
                      {item.value}
                    </a>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
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
