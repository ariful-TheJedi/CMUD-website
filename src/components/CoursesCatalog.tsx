import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CourseCard } from "@/components/CourseCard";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listPublicCourses } from "@/lib/courses.functions";
import {
  courseCategories,
  coursesPage,
  getCategorySlug,
  type CourseCategoryName,
} from "@/data/courses";

type Filter = (typeof coursesPage.filters)[number];

type CoursesCatalogProps = {
  activeCategory?: CourseCategoryName;
  heroTitle?: string;
  heroDescription?: string;
};

export function CoursesCatalog({
  activeCategory,
  heroTitle,
  heroDescription,
}: CoursesCatalogProps) {
  const active: Filter = activeCategory ?? "All";
  const listCourses = useServerFn(listPublicCourses);
  const { data: courses } = useSuspenseQuery({
    queryKey: ["public-courses"],
    queryFn: () => listCourses(),
  });
  const visible = active === "All" ? courses : courses.filter((c) => c.category === active);
  const { hero, filters, filterLabel } = coursesPage;

  return (
    <>
      <PageIntro
        eyebrow={hero.eyebrow}
        title={heroTitle ?? hero.title}
        description={heroDescription ?? hero.description}
      />

      <section className="container mx-auto px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Filter courses by category" className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const isActive = active === f;
            const className = cn("rounded-full");
            if (f === "All") {
              return (
                <Button
                  key={f}
                  asChild
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={className}
                >
                  <Link to="/courses" aria-current={isActive ? "page" : undefined}>
                    {filterLabel[f]}
                  </Link>
                </Button>
              );
            }
            const slug = getCategorySlug(f);
            if (!slug) return null;
            return (
              <Button
                key={f}
                asChild
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={className}
              >
                <Link
                  to="/courses/category/$slug"
                  params={{ slug }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {filterLabel[f]}
                </Link>
              </Button>
            );
          })}
        </nav>
        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          {visible.length} {visible.length === 1 ? "course" : "courses"} available
        </p>
        {visible.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center text-muted-foreground">
            <p>No published courses in this category yet.</p>
            <p className="mt-2 text-sm">
              <Link
                to="/courses"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Browse all courses
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function categoryHeroCopy(name: CourseCategoryName) {
  const cat = courseCategories.find((c) => c.name === name);
  return {
    title: `${name} courses.`,
    description: cat?.description ?? "Choose a course that fits your level and clinical focus.",
  };
}
