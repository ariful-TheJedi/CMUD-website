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
      <section className="relative overflow-hidden bg-surface text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--secondary)_18%,transparent),transparent_70%)]"
        />

        <div className="container relative mx-auto px-4 pt-10">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {hero.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            {hero.description}
          </p>
        </div>

        <div className="container relative mx-auto px-4 pb-10 pt-8">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-elegant)]">
            <img
              src={teamImg}
              alt={hero.imageAlt}
              width={1024}
              height={617}
              fetchPriority="high"
              decoding="async"
              className="block h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <SectionHeading
          eyebrow={roster.eyebrow}
          title={roster.title}
          description={roster.description}
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {faculty.map((f) => (
            <Card key={f.id} className="border-border/70">
              <CardContent className="flex gap-4 p-6">
                <FacultyPortrait
                  name={f.name}
                  initials={f.initials}
                  photo={f.photoUrl || f.photo}
                />

                <div>
                  <h2 className="font-serif text-lg font-bold leading-tight">{f.name}</h2>
                  <p className="text-xs uppercase tracking-wider text-secondary">{f.title}</p>
                  {f.specialty ? (
                    <p className="mt-1 text-xs text-muted-foreground">{f.specialty}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-medium text-foreground/80">{f.credentials}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{f.bio}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
