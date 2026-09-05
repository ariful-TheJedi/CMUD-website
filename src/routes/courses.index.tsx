import { createFileRoute } from "@tanstack/react-router";
import { CoursesCatalog } from "@/components/CoursesCatalog";
import { listPublicCourses } from "@/lib/courses.functions";
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

function CoursesPage() {
  return <CoursesCatalog />;
}
