import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { FacultyPortrait } from "@/components/FacultyPortrait";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicFaculty } from "@/lib/public-content";
import { facultyPage } from "@/data/faculty";

const facultyQueryOptions = queryOptions({
  queryKey: ["public-faculty"],
  queryFn: () => getPublicFaculty(),
});

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: facultyPage.meta.title },
      { name: "description", content: facultyPage.meta.description },
      { property: "og:title", content: facultyPage.meta.ogTitle },
      { property: "og:description", content: facultyPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(facultyQueryOptions);
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="container mx-auto px-4 py-16 text-sm text-destructive">
      {error.message}
    </div>
  ),
  component: FacultyPage,
});

function FacultyPage() {
  const { data: res } = useSuspenseQuery(facultyQueryOptions);
  const faculty = res.data;
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
            <Card key={f.name} className="border-border/70">
              <CardContent className="flex gap-4 p-6">
                <FacultyPortrait name={f.name} initials={f.initials} photo={f.photo} />

                <div>
                  <h2 className="font-serif text-lg font-bold leading-tight">{f.name}</h2>
                  <p className="text-xs uppercase tracking-wider text-secondary">{f.title}</p>
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
