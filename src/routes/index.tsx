import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Activity,
  Award,
  ArrowRight,
  CheckCircle2,
  Compass,
  Download,
  GraduationCap,
  Hand,
  HeartPulse,
  MapPin,
  Microscope,
  Quote,
  Radar,
  ScrollText,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseCard } from "@/components/CourseCard";
import { FacultyPortrait } from "@/components/FacultyPortrait";
import { SectionHeading } from "@/components/SectionHeading";
import { courseCategories } from "@/data/courses";
import { homePage } from "@/data/home";
import {
  getPublicCourses,
  getPublicFaculty,
  getPublicNotices,
  getPublicTestimonials,
} from "@/lib/public-content";
import { getHomePageContent } from "@/lib/page-content.functions";
import { defaultHomeContent } from "@/lib/home-content";

const featureIcons = {
  hand: Hand,
  users: Users,
  award: Award,
  microscope: Microscope,
} as const;

const categoryIcons: Record<string, LucideIcon> = {
  compass: Compass,
  radar: Radar,
  heartPulse: HeartPulse,
  scrollText: ScrollText,
};

const coursesQueryOptions = queryOptions({
  queryKey: ["public-courses"],
  queryFn: () => getPublicCourses(),
});

const facultyQueryOptions = queryOptions({
  queryKey: ["public-faculty"],
  queryFn: () => getPublicFaculty(),
});

const noticesQueryOptions = queryOptions({
  queryKey: ["public-notices"],
  queryFn: () => getPublicNotices(),
});

const testimonialsQueryOptions = queryOptions({
  queryKey: ["public-testimonials"],
  queryFn: () => getPublicTestimonials(),
});

const homeContentQueryOptions = queryOptions({
  queryKey: ["home-page-content"],
  queryFn: () => getHomePageContent(),
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(facultyQueryOptions);
    context.queryClient.ensureQueryData(noticesQueryOptions);
    context.queryClient.ensureQueryData(testimonialsQueryOptions);
    context.queryClient.ensureQueryData(coursesQueryOptions);
    const page = await context.queryClient.ensureQueryData(homeContentQueryOptions);
    return { metaTitle: page?.metaTitle ?? "", metaDescription: page?.metaDescription ?? "" };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.metaTitle || "CMUD — College of Medical Ultrasound & Doppler";
    const description =
      loaderData?.metaDescription ||
      "Hands-on professional training in medical ultrasound and Doppler imaging. CMUD trains doctors and sonographers with expert faculty and live patient sessions.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: HomePage,
});

function HomePage() {
  const { data: coursesRes } = useSuspenseQuery(coursesQueryOptions);
  const { data: facultyRes } = useSuspenseQuery(facultyQueryOptions);
  const { data: noticesRes } = useSuspenseQuery(noticesQueryOptions);
  const { data: testimonialsRes } = useSuspenseQuery(testimonialsQueryOptions);
  const { data: pageRecord } = useSuspenseQuery(homeContentQueryOptions);

  // CMS-managed sections (hero + hands-on)
  const content = pageRecord?.pageData ?? defaultHomeContent;
  const hero = content.hero;
  const hands = content.handsOn;
  const heroImg = hero.imageUrl || homePage.media.heroFallback;
  const handsImg = hands.imageUrl || homePage.media.handsOnFallback;

  // Dynamic lists (Supabase / fallbacks)
  const faculty = facultyRes.data;
  const courses = coursesRes.data;
  const featured = courses.filter((c) => c.featured);
  const testimonials = testimonialsRes.data;
  const latestNotices = noticesRes.data.slice(0, homePage.notices.limit);

  const {
    whyCmud,
    featuredCourses,
    categories,
    facultyPreview,
    notices,
    testimonials: testimonialsSection,
    contactCta,
  } = homePage;

  return (
    <>
      {/* Hero — CMS */}
      <section className="relative overflow-hidden bg-surface text-foreground">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay">
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover"
            width={1600}
            height={1024}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-surface/60 to-transparent" />
        <div className="container relative mx-auto grid gap-10 px-4 py-20 lg:grid-cols-12 lg:gap-12 lg:py-28">
          <div className="lg:col-span-7">
            <Badge className="border-0 bg-primary text-primary-foreground hover:bg-primary/90">
              <Activity className="mr-1 h-3 w-3" /> {hero.badge}
            </Badge>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              {hero.heading}
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              {hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={hero.primaryCtaHref}>
                  {hero.primaryCtaLabel} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={hero.secondaryCtaHref}>{hero.secondaryCtaLabel}</a>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-8">
              {hero.stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-serif text-3xl font-bold">{s.value}</dt>
                  <dd className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border/60 bg-card/50 p-2 shadow-[var(--shadow-elegant)]">
              <img
                src={heroImg}
                alt={hero.imageAlt}
                className="aspect-[4/5] w-full rounded-xl object-cover"
                width={1600}
                height={1024}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeading
          eyebrow={whyCmud.eyebrow}
          title={whyCmud.title}
          description={whyCmud.description}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyCmud.features.map((f) => {
            const Icon = featureIcons[f.icon];
            return (
              <Card
                key={f.title}
                className="group relative overflow-hidden border-border/70 bg-card shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[var(--shadow-card)]"
              >
                <div className="absolute left-0 top-0 h-1 w-full bg-[var(--gradient-accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <CardContent className="p-7">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-8 w-8" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-bold text-foreground">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Featured courses */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow={featuredCourses.eyebrow}
              title={featuredCourses.title}
              description={featuredCourses.description}
            />
            <Button asChild variant="outline">
              <Link to={featuredCourses.ctaTo}>
                {featuredCourses.ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Hands-on band — CMS */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative">
            <img
              src={handsImg}
              alt={hands.imageAlt}
              loading="lazy"
              width={1280}
              height={896}
              className="aspect-[5/4] w-full rounded-2xl object-cover shadow-[var(--shadow-elegant)]"
            />
            <div className="absolute -bottom-6 left-6 hidden rounded-xl bg-card p-4 shadow-[var(--shadow-card)] sm:block">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-6 w-6 text-secondary" />
                <div>
                  <p className="font-serif text-xl font-bold text-foreground">{hands.badgeValue}</p>
                  <p className="text-xs text-muted-foreground">{hands.badgeLabel}</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <SectionHeading
              eyebrow={hands.eyebrow}
              title={hands.title}
              description={hands.description}
            />
            <ul className="mt-6 space-y-3">
              {hands.bullets.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8">
              <a href={hands.ctaHref}>
                {hands.ctaLabel} <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-20">
          <SectionHeading
            eyebrow={categories.eyebrow}
            title={categories.title}
            align="center"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courseCategories.map((cat) => {
              const iconKey = categories.icons[cat.name as keyof typeof categories.icons];
              const Icon = (iconKey && categoryIcons[iconKey]) || GraduationCap;
              const count = courses.filter((c) => c.category === cat.name).length;
              return (
                <Link
                  key={cat.name}
                  to="/courses"
                  className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-colors duration-200 group-hover:bg-secondary">
                      <Icon className="h-7 w-7" strokeWidth={1.9} />
                    </div>
                    {count > 0 && (
                      <span className="mt-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        {count} {count === 1 ? "course" : "courses"}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 font-serif text-lg font-bold leading-snug text-foreground">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {cat.description}
                  </p>
                  <span className="mt-auto flex items-center gap-1.5 border-t border-border/70 pt-4 text-sm font-semibold text-primary transition-all group-hover:gap-2.5 group-hover:text-secondary">
                    {categories.exploreLabel} <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Faculty preview */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={facultyPreview.eyebrow} title={facultyPreview.title} />
          <Button asChild variant="outline">
            <Link to={facultyPreview.ctaTo}>
              {facultyPreview.ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {faculty.slice(0, facultyPreview.limit).map((f) => (
            <Card key={f.name} className="border-border/70">
              <CardContent className="flex gap-4 p-6">
                <FacultyPortrait
                  name={f.name}
                  initials={f.initials}
                  photo={f.photo}
                  className="h-24"
                />

                <div>
                  <h3 className="font-serif text-lg font-bold leading-tight">{f.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-secondary">{f.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{f.credentials}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Notices */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow={notices.eyebrow} title={notices.title} />
            <Button asChild variant="outline">
              <Link to={notices.ctaTo}>
                {notices.ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-4">
            {latestNotices.map((n) => {
              const d = new Date(n.noticeDate);
              return (
                <Card key={n.id} className="border-border/70">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-start gap-4">
                      <div className="hidden h-12 w-12 flex-col items-center justify-center rounded-md bg-primary text-primary-foreground sm:flex">
                        <span className="text-[10px] uppercase">
                          {d.toLocaleString("en", { month: "short" })}
                        </span>
                        <span className="font-serif text-lg font-bold leading-none">
                          {d.getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {n.category ? (
                            <Badge variant="secondary" className="bg-accent text-accent-foreground">
                              {n.category.name}
                            </Badge>
                          ) : null}
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {d.toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="mt-1 font-serif text-base font-bold">{n.title}</h3>
                        {n.body ? (
                          <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                        ) : null}
                        {n.attachments.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {n.attachments.map((a) => (
                              <a
                                key={a.id ?? a.fileUrl}
                                href={a.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={a.fileName}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm font-medium text-primary hover:underline"
                              >
                                <Download className="h-4 w-4" />
                                {a.displayName?.trim() || a.fileName}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeading
          eyebrow={testimonialsSection.eyebrow}
          title={testimonialsSection.title}
          align="center"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.slice(0, testimonialsSection.limit).map((t) => (
            <Card key={t.id} className="border-border/70">
              <CardContent className="p-6">
                <Quote className="h-6 w-6 text-secondary" />
                <p className="mt-3 text-base leading-relaxed">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {t.photoUrl ? <AvatarImage src={t.photoUrl} alt={t.name} /> : null}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-serif text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-10 text-foreground md:p-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold md:text-4xl">{contactCta.title}</h2>
              <p className="mt-3 text-muted-foreground">{contactCta.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={contactCta.primaryCtaTo}>{contactCta.primaryCtaLabel}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={contactCta.secondaryCtaTo}>{contactCta.secondaryCtaLabel}</Link>
                </Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4" /> {contactCta.location}
              </li>
              <li>{contactCta.hours}</li>
              <li className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.893c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  {contactCta.whatsapp}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  {contactCta.facebook}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  {contactCta.youtube}
                </span>
              </li>
              <li>{contactCta.phoneEmail}</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
