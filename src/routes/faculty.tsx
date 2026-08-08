import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FacultyPortrait } from "@/components/FacultyPortrait";
import { Card, CardContent } from "@/components/ui/card";
import { listPublicFaculty } from "@/lib/faculty.functions";
import { facultyPage } from "@/data/faculty";

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
  const { hero } = facultyPage;

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
