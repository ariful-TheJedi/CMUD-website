import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  ImageIcon,
  Monitor,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPublicCourseBySlug } from "@/lib/courses.functions";
import { courseDetailPage, DEFAULT_COURSE_WHATS_INCLUDED } from "@/data/courses";

function ListBullet({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <li className="flex items-start gap-2 text-sm leading-6 text-foreground">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-secondary">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 pt-px">{children}</span>
    </li>
  );
}

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params }) => {
    const course = await getPublicCourseBySlug({ data: { slug: params.slug } });
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.course;
    const title = c ? `${c.name} — CMUD` : "Course — CMUD";
    const desc = c?.shortDescription ?? "Ultrasound training course at CMUD.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-bold">{courseDetailPage.notFound.title}</h1>
      <Button asChild className="mt-6">
        <Link to="/courses">{courseDetailPage.notFound.cta}</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-bold">{courseDetailPage.error.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      <Button asChild className="mt-6">
        <Link to="/courses">{courseDetailPage.error.cta}</Link>
      </Button>
    </div>
  ),
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { course } = Route.useLoaderData();
  const savings = course.fee - course.discountFee;
  const copy = courseDetailPage;
  const whatsIncluded =
    course.whatsIncluded?.length > 0
      ? course.whatsIncluded
      : DEFAULT_COURSE_WHATS_INCLUDED;

  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto grid gap-10 px-4 py-16 md:py-20 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Badge className="border-0 bg-primary-glow text-foreground hover:bg-secondary">
              {course.category}
            </Badge>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight md:text-5xl">
              {course.name}
            </h1>
            <p className="mt-4 max-w-2xl text-foreground/85">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                <Clock className="h-4 w-4" /> {course.duration}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                <Monitor className="h-4 w-4" /> {course.mode}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                <GraduationCap className="h-4 w-4" /> {course.eligibility}
              </span>
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-2xl bg-card p-6 text-foreground shadow-[var(--shadow-elegant)]">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.feeLabel}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-primary">
                  BDT {course.discountFee.toLocaleString()}
                </span>
                {savings > 0 && (
                  <span className="text-muted-foreground line-through">
                    {course.fee.toLocaleString()}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="mt-1 text-xs font-medium text-secondary">
                  Save BDT {savings.toLocaleString()} {copy.savingsSuffix}
                </p>
              )}
              <Button asChild size="lg" className="mt-5 w-full">
                <Link to="/admission" search={{ course: course.slug }}>
                  {copy.applyLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">{copy.seatsNote}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="container mx-auto px-4 pt-10">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={`${course.name} cover`}
              className="aspect-[16/6] w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[16/6] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm">{copy.imagePlaceholder}</p>
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto grid gap-12 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl font-bold">{copy.sections.syllabus}</h2>
          <ul className="mt-5 space-y-3">
            {course.syllabus.map((s: string) => (
              <ListBullet key={s} icon={BookOpen}>
                {s}
              </ListBullet>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold">{copy.sections.outcomes}</h2>
          <ul className="mt-5 space-y-3">
            {course.outcomes.map((o: string) => (
              <ListBullet key={o} icon={Target}>
                {o}
              </ListBullet>
            ))}
          </ul>

          {whatsIncluded.length > 0 ? (
            <div className="mt-10">
              <h2 className="font-serif text-2xl font-bold">{copy.sections.whatsIncluded}</h2>
              <ul className="mt-5 space-y-3">
                {whatsIncluded.map((item) => (
                  <ListBullet key={item} icon={CheckCircle2}>
                    {item}
                  </ListBullet>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-10 rounded-xl bg-surface p-6">
            <h3 className="font-serif text-lg font-bold">{copy.sections.eligibility}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{course.eligibility}</p>
          </div>
        </div>
      </section>
    </>
  );
}
