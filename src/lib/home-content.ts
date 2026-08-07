/**
 * Shape + normalizer for the editable Home page content stored in
 * `public.page_content.page_data` (slug = "home").
 * Browser-safe: no server-only imports.
 */

export type HeroStat = { value: string; label: string };

export type HeroContent = {
  badge: string;
  heading: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  imageUrl: string;
  imageAlt: string;
  stats: HeroStat[];
};

export type HandsOnContent = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  badgeValue: string;
  badgeLabel: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
};

export type HomePageContent = {
  hero: HeroContent;
  handsOn: HandsOnContent;
};

export const defaultHomeContent: HomePageContent = {
  hero: {
    badge: "Admissions open — July 2026",
    heading: "Master medical ultrasound with hands-on training that matters.",
    description:
      "CMUD is a dedicated institute for diagnostic ultrasound and Doppler imaging. Learn from senior consultants, scan real patients daily, and graduate ready to practise. Get Free repeat Classes and unlimited practical session for 1 year.",
    primaryCtaLabel: "Apply Now",
    primaryCtaHref: "/admission",
    secondaryCtaLabel: "View Courses",
    secondaryCtaHref: "/courses",
    imageUrl: "",
    imageAlt: "CMUD instructor demonstrating ultrasound scanning",
    stats: [
      { value: "1,200+", label: "Trainees" },
      { value: "12", label: "Years" },
      { value: "25+", label: "Faculty" },
    ],
  },
  handsOn: {
    eyebrow: "Hands-on Ultrasound Training",
    title: "Real patients. Real protocols. Real reports.",
    description:
      "CMUD has integrated clinic and partnered with NGOs so you practise on actual cases — from routine abdominal scans to complex fetal Doppler — under expert supervision.",
    imageUrl: "",
    imageAlt: "Trainee performing an obstetric ultrasound scan",
    badgeValue: "120+",
    badgeLabel: "scans per trainee",
    bullets: [
      "Small batches of 3-5 trainees per advanced course",
      "Daily live patient scanning sessions",
      "Structured reporting templates",
      "Everyday Case review of own clinic patients",
    ],
    ctaLabel: "More about CMUD",
    ctaHref: "/about",
  },
};

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim().length > 0 ? v : fallback;
}

/** Coerce arbitrary JSON into a complete, safe HomePageContent object. */
export function normalizeHomeContent(raw: unknown): HomePageContent {
  const d = defaultHomeContent;
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const hero = (obj.hero && typeof obj.hero === "object" ? obj.hero : {}) as Record<
    string,
    unknown
  >;
  const handsOn = (obj.handsOn && typeof obj.handsOn === "object" ? obj.handsOn : {}) as Record<
    string,
    unknown
  >;

  const stats = Array.isArray(hero.stats)
    ? (hero.stats as unknown[])
        .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
        .map((s) => ({ value: str(s.value, ""), label: str(s.label, "") }))
        .filter((s) => s.value || s.label)
    : d.hero.stats;

  const bullets = Array.isArray(handsOn.bullets)
    ? (handsOn.bullets as unknown[]).filter((b): b is string => typeof b === "string" && !!b.trim())
    : d.handsOn.bullets;

  return {
    hero: {
      badge: str(hero.badge, d.hero.badge),
      heading: str(hero.heading, d.hero.heading),
      description: str(hero.description, d.hero.description),
      primaryCtaLabel: str(hero.primaryCtaLabel, d.hero.primaryCtaLabel),
      primaryCtaHref: str(hero.primaryCtaHref, d.hero.primaryCtaHref),
      secondaryCtaLabel: str(hero.secondaryCtaLabel, d.hero.secondaryCtaLabel),
      secondaryCtaHref: str(hero.secondaryCtaHref, d.hero.secondaryCtaHref),
      imageUrl: typeof hero.imageUrl === "string" ? hero.imageUrl : "",
      imageAlt: str(hero.imageAlt, d.hero.imageAlt),
      stats,
    },
    handsOn: {
      eyebrow: str(handsOn.eyebrow, d.handsOn.eyebrow),
      title: str(handsOn.title, d.handsOn.title),
      description: str(handsOn.description, d.handsOn.description),
      imageUrl: typeof handsOn.imageUrl === "string" ? handsOn.imageUrl : "",
      imageAlt: str(handsOn.imageAlt, d.handsOn.imageAlt),
      badgeValue: str(handsOn.badgeValue, d.handsOn.badgeValue),
      badgeLabel: str(handsOn.badgeLabel, d.handsOn.badgeLabel),
      bullets,
      ctaLabel: str(handsOn.ctaLabel, d.handsOn.ctaLabel),
      ctaHref: str(handsOn.ctaHref, d.handsOn.ctaHref),
    },
  };
}
