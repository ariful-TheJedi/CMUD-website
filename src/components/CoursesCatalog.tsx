import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CourseCard } from "@/components/CourseCard";
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
  const visible =
    active === "All" ? courses : courses.filter((c) => c.category === active);
  const { hero, filters, filterLabel } = coursesPage;

  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto px-4 py-10">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {heroTitle ?? hero.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            {heroDescription ?? hero.description}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2">
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
                  <Link to="/courses">{filterLabel[f]}</Link>
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
                <Link to="/courses/category/$slug" params={{ slug }}>
                  {filterLabel[f]}
                </Link>
              </Button>
            );
          })}
        </div>
        {visible.length === 0 ? (
          <p className="mt-8 text-muted-foreground">
            No published courses in this category yet.{" "}
            <Link to="/courses" className="font-semibold text-primary underline-offset-4 hover:underline">
              Browse all courses
            </Link>
            .
          </p>
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
    description:
      cat?.description ??
      "Choose a course that fits your level and clinical focus.",
  };
}
