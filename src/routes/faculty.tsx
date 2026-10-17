import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FacultyPortrait } from "@/components/FacultyPortrait";
import { SectionHeading } from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { listPublicFaculty } from "@/lib/faculty.functions";
import { facultyPage } from "@/data/faculty";
import { assetUrl } from "@/lib/assets";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: facultyPage.meta.title },
      { name: "robots", content: "index, follow" },
      { name: "description", content: facultyPage.meta.description },
      { property: "og:title", content: facultyPage.meta.ogTitle },
      { property: "og:description", content: facultyPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["public-faculty"],
      queryFn: () => listPublicFaculty(),
    }),
  errorComponent: ({ error }) => (
    <div role="alert" className="container mx-auto px-4 py-16 text-sm text-destructive">
      {error.message}
    </div>
  ),
  component: FacultyPage,
});

function FacultyPage() {
  const listFaculty = useServerFn(listPublicFaculty);
  const { data: faculty } = useSuspenseQuery({
    queryKey: ["public-faculty"],
    queryFn: () => listFaculty(),
  });
  const { hero, roster } = facultyPage;
  const teamImg = assetUrl(hero.image);

  return (
    <>
      <section className="border-b border-border/60 bg-surface text-foreground lg:flex lg:min-h-[calc(100svh-110px)] lg:items-center">
        <div className="container mx-auto flex flex-col items-center px-4 py-8 text-center sm:py-10 lg:py-12">
          <div className="w-full">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              {hero.eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {hero.description}
            </p>
          </div>

          <div className="mt-7 w-full max-w-4xl sm:mt-9">
            <img
              src={teamImg}
              alt={hero.imageAlt}
              width={1024}
              height={617}
              fetchPriority="high"
              decoding="async"
              className="block aspect-[1024/617] w-full rounded-2xl object-cover shadow-[var(--shadow-card)]"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow={roster.eyebrow}
          title={roster.title}
          description={roster.description}
        />
        <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {faculty.map((f) => (
            <Card
              key={f.id}
              className="h-full border-border/70 transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <CardContent className="flex h-full items-start gap-4 p-5 sm:p-6">
                <FacultyPortrait
                  name={f.name}
                  initials={f.initials}
                  photo={f.photoUrl || f.photo}
                />

                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-bold leading-tight">{f.name}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-secondary">
                    {f.title}
                  </p>
                  {f.specialty ? (
                    <p className="mt-1 text-xs text-muted-foreground">{f.specialty}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-medium text-foreground/80">{f.credentials}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.bio}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
