import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CourseCard } from "@/components/CourseCard";
import { listPublicCourses } from "@/lib/courses.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { coursesPage } from "@/data/courses";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: coursesPage.meta.title },
      { name: "description", content: coursesPage.meta.description },
      { property: "og:title", content: coursesPage.meta.ogTitle },
      { property: "og:description", content: coursesPage.meta.ogDescription },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["public-courses"],
      queryFn: () => listPublicCourses(),
    }),
  component: CoursesPage,
});

type Filter = (typeof coursesPage.filters)[number];

function CoursesPage() {
  const [active, setActive] = useState<Filter>("All");
  const listCourses = useServerFn(listPublicCourses);
  const { data: courses } = useSuspenseQuery({
    queryKey: ["public-courses"],
    queryFn: () => listCourses(),
  });
  const visible = active === "All" ? courses : courses.filter((c) => c.category === active);
  const { hero, filters, filterLabel } = coursesPage;

  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-foreground/80">{hero.description}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f}
              variant={active === f ? "default" : "outline"}
              size="sm"
              onClick={() => setActive(f)}
              className={cn("rounded-full")}
            >
              {filterLabel[f]}
            </Button>
          ))}
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>
    </>
  );
}
