import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  ImageIcon,
  Monitor,
  Target,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getPublicCourseBySlug } from "@/lib/courses.functions";
import {
  courseDetailPage,
  DEFAULT_COURSE_WHATS_INCLUDED,
  courseFeeDisplay,
  eligibilityBullets,
  formatCourseDuration,
} from "@/data/courses";
import { syllabusModuleCount } from "@/lib/syllabus";
import { assetUrl } from "@/lib/assets";

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

function ModuleBullet({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 text-sm leading-6 text-foreground">
      <span
        className="mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-secondary px-1.5 text-xs font-bold tabular-nums text-secondary-foreground"
        aria-label={`Module ${index}`}
      >
        {index}
      </span>
      <span className="min-w-0 flex-1 pt-0.5">{children}</span>
    </li>
  );
}

/** Strip leading "Module N" labels so CMS text + UI numbering never double up. */
function stripModulePrefix(text: string): string {
  return text
    .replace(/^\s*module\s*\d+\s*[:.\-)–—]?\s*/i, "")
    .trim();
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
  const { displayFee, compareAtFee, savings, hasDiscount } = courseFeeDisplay(
    course.fee,
    course.discountFee,
  );
  const copy = courseDetailPage;
  const whatsIncluded =
    course.whatsIncluded?.length > 0
      ? course.whatsIncluded
      : DEFAULT_COURSE_WHATS_INCLUDED;

  return (
    <>
      <section className="bg-surface text-foreground">
        <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Badge className="border-0 bg-primary-glow text-foreground hover:bg-secondary">
              {course.category}
            </Badge>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {course.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              {course.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                <Clock className="h-4 w-4" /> {formatCourseDuration(course.duration)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                <Monitor className="h-4 w-4" /> {course.mode}
              </span>
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-2xl bg-card p-6 text-foreground shadow-[var(--shadow-elegant)]">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.feeLabel}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-primary">
                  BDT {displayFee.toLocaleString()}
                </span>
                {compareAtFee != null ? (
                  <span className="text-muted-foreground line-through">
                    {compareAtFee.toLocaleString()}
                  </span>
                ) : null}
              </div>
              {hasDiscount ? (
                <p className="mt-1 text-xs font-medium text-secondary">
                  Save BDT {savings.toLocaleString()} {copy.savingsSuffix}
                </p>
              ) : null}
              {course.admissionFee > 0 ? (
                <div className="mt-4 border-t border-border/70 pt-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {copy.admissionFeeLabel}
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold text-foreground">
                    BDT {course.admissionFee.toLocaleString()}
                  </p>
                </div>
              ) : null}
              {course.installmentsAvailable ? (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-secondary">
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  {copy.installmentsLabel}
                </p>
              ) : null}
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
              src={assetUrl(course.imageUrl)}
              alt={`${course.name} cover`}
              className="aspect-[4/3] w-full object-cover object-center sm:aspect-[16/6]"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 text-muted-foreground sm:aspect-[16/6]">
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm">{copy.imagePlaceholder}</p>
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-2">
        <SyllabusSection course={course} copy={copy} />

        <div>
          {course.outcomes.length > 0 ? (
            <>
              <h2 className="font-serif text-xl font-bold md:text-2xl">{copy.sections.outcomes}</h2>
              <ul className="mt-5 space-y-3">
                {course.outcomes.map((o: string) => (
                  <ListBullet key={o} icon={Target}>
                    {o}
                  </ListBullet>
                ))}
              </ul>
            </>
          ) : null}

          {whatsIncluded.length > 0 ? (
            <div className={course.outcomes.length > 0 ? "mt-8" : undefined}>
              <h2 className="font-serif text-xl font-bold md:text-2xl">{copy.sections.whatsIncluded}</h2>
              <ul className="mt-5 space-y-3">
                {whatsIncluded.map((item) => (
                  <ListBullet key={item} icon={BadgeCheck}>
                    {item}
                  </ListBullet>
                ))}
              </ul>
            </div>
          ) : null}

          {eligibilityBullets(course.eligibility).length > 0 ? (
            <div
              className={`rounded-xl bg-surface p-6 ${
                course.outcomes.length > 0 || whatsIncluded.length > 0 ? "mt-8" : ""
              }`}
            >
              <h3 className="font-serif text-lg font-bold">{copy.sections.eligibility}</h3>
              <ul className="mt-4 space-y-3">
                {eligibilityBullets(course.eligibility).map((item) => (
                  <ListBullet key={item} icon={UserCheck}>
                    {item}
                  </ListBullet>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function SyllabusSection({
  course,
  copy,
}: {
  course: {
    syllabus: string[];
    syllabusMode: string;
    syllabusSemesters: { label: string; modules: string[] }[];
  };
  copy: typeof courseDetailPage;
}) {
  const semesters = (course.syllabusSemesters ?? []).filter(
    (s) => (s.modules?.length ?? 0) > 0,
  );
  const isSemester =
    course.syllabusMode === "semester" && semesters.length > 0;
  const flatModules = course.syllabus ?? [];
  const totalCount = syllabusModuleCount(
    isSemester ? "semester" : "flat",
    flatModules,
    semesters,
  );

  if (isSemester) {
    return (
      <div>
        <h2 className="font-serif text-xl font-bold md:text-2xl">
          {copy.sections.syllabusWithCount(totalCount)}
        </h2>
        <Accordion type="multiple" defaultValue={["semester-0"]} className="mt-5 space-y-3">
          {semesters.map((s, i) => (
            <AccordionItem
              key={`${s.label}-${i}`}
              value={`semester-${i}`}
              className="overflow-hidden rounded-xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="py-4 font-serif text-base font-bold hover:no-underline md:text-lg">
                <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <span className="truncate text-foreground">{s.label}</span>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-sans text-xs font-medium tabular-nums text-muted-foreground">
                    {s.modules.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ul className="space-y-3 border-t border-border/70 pt-4">
                  {s.modules.map((mod, mi) => (
                    <ModuleBullet key={`${i}-${mi}-${mod}`} index={mi + 1}>
                      {stripModulePrefix(mod) || mod}
                    </ModuleBullet>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }

  if (flatModules.length === 0) return null;

  return (
    <div>
      <h2 className="font-serif text-xl font-bold md:text-2xl">
        {copy.sections.syllabusWithCount(totalCount)}
      </h2>
      <ul className="mt-5 space-y-3">
        {flatModules.map((s: string, i: number) => (
          <ModuleBullet key={`${i}-${s}`} index={i + 1}>
            {stripModulePrefix(s) || s}
          </ModuleBullet>
        ))}
      </ul>
    </div>
  );
}
