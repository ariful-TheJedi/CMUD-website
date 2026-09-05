import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CoursesCatalog, categoryHeroCopy } from "@/components/CoursesCatalog";
import { listPublicCourses } from "@/lib/courses.functions";
import { courseDetailPage, getCategoryBySlug } from "@/data/courses";

export const Route = createFileRoute("/courses/category/$slug")({
  loader: ({ context, params }) => {
    const category = getCategoryBySlug(params.slug);
    if (!category) throw notFound();
    return context.queryClient.ensureQueryData({
      queryKey: ["public-courses"],
      queryFn: () => listPublicCourses(),
    }).then(() => ({ category }));
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Category";
    const title = `${name} Courses — CMUD`;
    const description = `Browse ${name.toLowerCase()} ultrasound and Doppler training programs at CMUD.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-bold">{courseDetailPage.notFound.title}</h1>
      <p className="mt-4 text-muted-foreground">That course category does not exist.</p>
      <Link
        to="/courses"
        className="mt-6 inline-block font-semibold text-primary underline-offset-4 hover:underline"
      >
        {courseDetailPage.notFound.cta}
      </Link>
    </div>
  ),
  component: CategoryCoursesPage,
});

function CategoryCoursesPage() {
  const { category } = Route.useLoaderData();
  const hero = categoryHeroCopy(category.name);
  return (
    <CoursesCatalog
      activeCategory={category.name}
      heroTitle={hero.title}
      heroDescription={hero.description}
    />
  );
}
