/**
 * Course types + seed/page copy.
 * Live course lists load from Postgres via `listPublicCourses` / `getPublicCourseBySlug`.
 */
import type { SyllabusMode, SyllabusSemester } from "@/lib/syllabus";

export type { SyllabusMode, SyllabusSemester };
export type CourseMode = "Online" | "Offline" | "Online/Offline/Both";

export type Course = {
  slug: string;
  name: string;
  category: string;
  duration: string;
  fee: number;
  discountFee: number;
  /** One-time admission fee from details JSONB (0 = hide). */
  admissionFee: number;
  mode: CourseMode;
  /** One criterion per line in CMS (legacy comma / slash lists still supported). */
  eligibility: string;
  shortDescription: string;
  description: string;
  /** Flat module list (used when syllabusMode is "flat"). */
  syllabus: string[];
  /** "flat" = syllabus only; "semester" = syllabusSemesters with dropdown on detail page. */
  syllabusMode: SyllabusMode;
  syllabusSemesters: SyllabusSemester[];
  outcomes: string[];
  /** Items shown under “What’s included in the course” on the detail page. */
  whatsIncluded: string[];
  featured?: boolean;
  imageUrl?: string;
};

/** Split eligibility into bullets. Prefer one item per line; also accept commas or " / ". */
export function eligibilityBullets(eligibility: string | null | undefined): string[] {
  const raw = (eligibility ?? "").trim();
  if (!raw) return [];
  if (/\r?\n/.test(raw)) {
    return raw
      .split(/\r?\n/)
      .map((s) => s.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }
  return raw
    .split(/,|\s*\/\s*/)
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

/** Normalize for CMS storage: one requirement per line. */
export function eligibilityToCmsString(eligibility: string | null | undefined): string {
  return eligibilityBullets(eligibility).join("\n");
}

/** Map any stored mode (including legacy Onsite/Hybrid/Both) to Online | Offline | Online/Offline/Both. */
export function normalizeCourseMode(mode: string | null | undefined): CourseMode {
  const raw = (mode ?? "").trim().toLowerCase();
  if (!raw) return "Offline";
  if (raw === "online") return "Online";
  if (raw === "offline" || raw === "onsite") return "Offline";
  if (
    raw === "online/offline/both" ||
    raw === "offline/online/both" ||
    raw === "both" ||
    raw === "hybrid" ||
    raw.includes("hybrid") ||
    raw.includes("both")
  ) {
    return "Online/Offline/Both";
  }
  return "Offline";
}

/**
 * Display duration with a clear unit. Bare numbers (e.g. "3", "12-18") become months.
 * Values that already include week/month/year are left as-is.
 */
export function formatCourseDuration(duration: string | null | undefined): string {
  const raw = (duration ?? "").trim();
  if (!raw) return "";
  if (/\b(month|months|week|weeks|year|years|day|days|yr|yrs|mo)\b/i.test(raw)) {
    return raw.replace(/\bmonth\b/i, (m) => (m[0] === "M" ? "Months" : "months")).replace(
      /^(\d+)\s*month$/i,
      (_, n) => `${n} ${Number(n) === 1 ? "Month" : "Months"}`,
    );
  }
  // "3", "12", "12-18", "12–18"
  if (/^\d+(\s*[-–—]\s*\d+)?$/.test(raw)) {
    const normalized = raw.replace(/\s*[-–—]\s*/, "–");
    const end = normalized.split("–").pop();
    const n = Number(end);
    const unit = n === 1 ? "Month" : "Months";
    return `${normalized} ${unit}`;
  }
  return `${raw} Months`;
}

/** Default CMS seed for courses that do not set a custom includes list. */
export const DEFAULT_COURSE_WHATS_INCLUDED: string[] = [
  "Hands-on scanning practice sessions",
  "Live demonstrations with experienced faculty",
  "Printed / digital study materials & protocols",
  "Certificate of completion",
  "Batch mentoring & case discussion support",
];

type CourseSeed = Omit<
  Course,
  "whatsIncluded" | "syllabusMode" | "syllabusSemesters" | "admissionFee"
> & {
  whatsIncluded?: string[];
  syllabusMode?: SyllabusMode;
  syllabusSemesters?: SyllabusSemester[];
  admissionFee?: number;
};

const courseSeeds: CourseSeed[] = [
  {
    slug: "basic-ultrasound",
    name: "Certificate in Medical Ultrasound",
    category: "Foundation",
    duration: "3 Months",
    fee: 20000,
    discountFee: 15000,
    mode: "Online/Offline/Both",
    eligibility: "MBBS / BDS / Final-year medical students",
    shortDescription:
      "Foundational training covering ultrasound physics, knobology, and abdominal scanning.",
    description:
      "Build a strong base in diagnostic ultrasound. Live patient demonstrations, daily hands-on practice, and case-based learning prepare you to perform routine abdominal, pelvic, and obstetric scans confidently.",
    syllabus: [
      "Ultrasound physics & instrumentation",
      "Abdominal sonography",
      "Pelvic & obstetric scanning",
      "KUB and thyroid imaging",
      "Reporting & documentation",
    ],
    outcomes: [
      "Perform routine abdominal and obstetric scans",
      "Identify common pathology with confidence",
      "Produce structured ultrasound reports",
    ],
    featured: true,
  },
  {
    slug: "advanced-doppler",
    name: "Advanced Doppler Imaging",
    category: "Advanced",
    duration: "4 Months",
    fee: 85000,
    discountFee: 70000,
    mode: "Offline",
    eligibility: "Completion of Basic Ultrasound or equivalent experience",
    shortDescription:
      "Master vascular, cardiac, and obstetric Doppler with daily scanning sessions.",
    description:
      "An intensive program focused on color, spectral, and power Doppler. Daily live cases across peripheral vascular, carotid, renal, and fetal Doppler with expert mentorship.",
    syllabus: [
      "Doppler physics & artefacts",
      "Carotid & peripheral vascular Doppler",
      "Renal & portal Doppler",
      "Obstetric Doppler & fetal wellbeing",
      "Cardiac Doppler basics",
    ],
    outcomes: [
      "Confidently perform and interpret Doppler studies",
      "Recognise vascular pathology early",
      "Integrate Doppler into clinical decisions",
    ],
    featured: true,
  },
  {
    slug: "obstetric-ultrasound",
    name: "Obstetric & Gynecological Ultrasound",
    category: "Specialty",
    duration: "2 Months",
    fee: 55000,
    discountFee: 42000,
    mode: "Online/Offline/Both",
    eligibility: "MBBS / MD / Postgraduate trainees",
    shortDescription: "Trimester-wise obstetric scanning and complete gynae imaging protocol.",
    description:
      "From early pregnancy scans to anomaly screening and 3D/4D obstetric imaging — all backed by structured reporting templates and protocol-driven practice.",
    syllabus: [
      "Early pregnancy scan",
      "Anomaly scan (Level II)",
      "Fetal biometry & growth",
      "Gynaecological pelvic scan",
      "3D/4D fundamentals",
    ],
    outcomes: [
      "Perform trimester-wise obstetric scans",
      "Detect common fetal anomalies",
      "Report gynae cases to international standards",
    ],
    featured: true,
  },
  {
    slug: "msk-ultrasound",
    name: "Musculoskeletal Ultrasound",
    category: "Specialty",
    duration: "6 Weeks",
    fee: 40000,
    discountFee: 32000,
    mode: "Online/Offline/Both",
    eligibility: "MBBS / Physiotherapists / Sports physicians",
    shortDescription: "Joint-by-joint scanning protocol with live model demonstrations.",
    description:
      "A practical MSK program covering shoulder, knee, ankle, wrist, and small joints. Includes ultrasound-guided injection techniques.",
    syllabus: [
      "MSK probe selection & technique",
      "Shoulder, elbow, wrist protocols",
      "Hip, knee, ankle protocols",
      "Nerve & tendon imaging",
      "USG-guided injections",
    ],
    outcomes: [
      "Independently scan major joints",
      "Identify tears, effusions, and impingement",
      "Assist in image-guided procedures",
    ],
  },
  {
    slug: "echocardiography",
    name: "Basic Echocardiography",
    category: "Advanced",
    duration: "3 Months",
    fee: 75000,
    discountFee: 60000,
    mode: "Offline",
    eligibility: "MBBS / Cardiology trainees",
    shortDescription: "2D, M-mode and Doppler echocardiography with daily cardiac case practice.",
    description:
      "A structured echo program led by senior cardiologists. Covers standard views, chamber quantification, valve assessment, and bedside echo for emergencies.",
    syllabus: [
      "Standard echo views",
      "Chamber quantification",
      "Valvular heart disease",
      "Doppler hemodynamics",
      "Focused cardiac ultrasound (FoCUS)",
    ],
    outcomes: [
      "Perform a complete adult echo study",
      "Quantify ventricular function",
      "Identify common valve pathology",
    ],
  },
  {
    slug: "emergency-pocus",
    name: "Emergency POCUS",
    category: "Foundation",
    duration: "4 Weeks",
    fee: 30000,
    discountFee: 24000,
    mode: "Offline",
    eligibility: "Emergency physicians, ICU & critical-care doctors",
    shortDescription: "Point-of-care ultrasound for ER, ICU and acute-care decisions.",
    description:
      "Fast-track POCUS course built around real ER scenarios: FAST, lung, cardiac, IVC and procedural guidance.",
    syllabus: [
      "FAST & e-FAST",
      "Lung ultrasound",
      "Focused cardiac ultrasound",
      "IVC & volume status",
      "USG-guided line placement",
    ],
    outcomes: [
      "Run a POCUS protocol in under 10 minutes",
      "Make bedside decisions with imaging support",
      "Guide procedures safely with ultrasound",
    ],
  },
  {
    slug: "medical-echocardiography",
    name: "Advance Certificate in Medical Echocardiography",
    category: "Advanced",
    duration: "8 Weeks",
    fee: 35000,
    discountFee: 30000,
    mode: "Offline",
    eligibility: "MBBS / MD / Cardiology & internal medicine trainees",
    shortDescription:
      "Comprehensive echocardiography training — standard views, chamber quantification, valves and Doppler hemodynamics.",
    description:
      "An advanced echo certificate built around daily live scanning. Covers 2D, M-mode, color and spectral Doppler, with structured reporting practice on real cardiac cases mentored by senior cardiologists.",
    syllabus: [
      "Cardiac anatomy & standard echo windows",
      "Chamber quantification & LV function",
      "Valvular heart disease assessment",
      "Doppler hemodynamics & shunts",
      "Pericardial disease & emergency echo",
    ],
    outcomes: [
      "Perform a complete adult transthoracic echo",
      "Quantify systolic and diastolic function",
      "Detect and grade common valve pathology",
    ],
  },
  {
    slug: "msk-certificate",
    name: "Certificate in Musculoskeletal Ultrasound (MSK)",
    category: "Advanced",
    duration: "8 Weeks",
    fee: 40000,
    discountFee: 35000,
    mode: "Online/Offline/Both",
    eligibility: "MBBS / Physiotherapists / Sports & rehab physicians",
    shortDescription:
      "Advanced joint-by-joint MSK scanning with live model practice and image-guided injection technique.",
    description:
      "A certificate-level MSK program covering upper and lower limb joints, peripheral nerves, tendons and soft-tissue pathology. Includes hands-on ultrasound-guided injection workshops.",
    syllabus: [
      "Probe selection & MSK scanning technique",
      "Shoulder, elbow & wrist protocols",
      "Hip, knee & ankle protocols",
      "Peripheral nerve & tendon imaging",
      "Ultrasound-guided injections",
    ],
    outcomes: [
      "Independently scan all major joints",
      "Identify tears, effusions and impingement syndromes",
      "Assist confidently in image-guided MSK procedures",
    ],
  },
  {
    slug: "paediatric-ultrasound",
    name: "Certificate in Paediatric Ultrasound (CPU)",
    category: "Advanced",
    duration: "8 Weeks",
    fee: 35000,
    discountFee: 30000,
    mode: "Offline",
    eligibility: "MBBS / Paediatricians / Radiology trainees",
    shortDescription:
      "Focused paediatric sonography — neonatal cranial, abdominal, hip and chest scanning protocols.",
    description:
      "A specialised certificate course in paediatric ultrasound. Daily live cases cover neonatal brain, hip dysplasia screening, paediatric abdomen, urinary tract and chest, with age-appropriate reporting templates.",
    syllabus: [
      "Neonatal cranial ultrasound",
      "Developmental dysplasia of the hip (DDH)",
      "Paediatric abdominal & urinary tract scan",
      "Paediatric chest & soft-tissue imaging",
      "Reporting & parent communication",
    ],
    outcomes: [
      "Perform safe, age-appropriate paediatric scans",
      "Screen for DDH and common neonatal pathology",
      "Report paediatric studies to international standards",
    ],
  },
  {
    slug: "target-organ",
    name: "Certificate in Target Organ Ultrasound",
    category: "Advanced",
    duration: "4 Weeks",
    fee: 30000,
    discountFee: 25000,
    mode: "Offline",
    eligibility: "MBBS / Practising clinicians with basic ultrasound exposure",
    shortDescription:
      "Focused organ-specific scanning — thyroid, breast, scrotum and small parts imaging.",
    description:
      "A short, intensive certificate focused on targeted small-parts ultrasound. Trainees develop sharp protocol-driven scanning of thyroid, breast, scrotum and superficial lesions, with structured reporting practice.",
    syllabus: [
      "Thyroid & parathyroid sonography",
      "Breast ultrasound & BI-RADS reporting",
      "Scrotal & testicular imaging",
      "Superficial lumps & lymph node assessment",
      "Image-guided FNA fundamentals",
    ],
    outcomes: [
      "Perform focused small-parts ultrasound confidently",
      "Apply BI-RADS / TI-RADS reporting frameworks",
      "Recognise benign vs suspicious lesions",
    ],
  },
  {
    slug: "congenital-anomalies-detection",
    name: "Congenital Anomalies Detection",
    category: "Advanced",
    duration: "8 Weeks",
    fee: 40000,
    discountFee: 35000,
    mode: "Offline",
    eligibility: "MBBS / Obstetricians / Radiologists with basic obstetric scanning experience",
    shortDescription:
      "Systematic anomaly scanning — fetal organ surveys, soft markers and structured anomaly reporting.",
    description:
      "An advanced fetal medicine course focused on the detection of congenital anomalies. Covers first, second and third trimester anomaly surveys, soft markers, and protocol-based reporting using international guidelines.",
    syllabus: [
      "First trimester anomaly screening",
      "Level II (anomaly) scan — head to toe",
      "Fetal cardiac screening views",
      "Soft markers & risk stratification",
      "Structured anomaly reporting",
    ],
    outcomes: [
      "Perform a complete fetal anomaly survey",
      "Detect major structural anomalies confidently",
      "Counsel and report findings using standard protocols",
    ],
  },
  {
    slug: "pregnancy-profile",
    name: "Hands-on Training — Pregnancy Profile",
    category: "Advanced",
    duration: "6 Weeks",
    fee: 35000,
    discountFee: 35000,
    mode: "Offline",
    eligibility: "MBBS / Obstetricians / Sonologists",
    shortDescription:
      "Trimester-wise pregnancy scanning with daily hands-on practice on live patients.",
    description:
      "An intensive hands-on program covering the complete pregnancy profile — viability, dating, anomaly, growth and wellbeing scans. Live patient sessions every day with one-to-one mentoring.",
    syllabus: [
      "Early pregnancy & viability scan",
      "Dating & nuchal translucency",
      "Anomaly scan overview",
      "Fetal growth & biometry",
      "Liquor, placenta & fetal wellbeing",
    ],
    outcomes: [
      "Perform trimester-wise pregnancy scans independently",
      "Produce a complete pregnancy profile report",
      "Assess fetal growth and wellbeing accurately",
    ],
  },
  {
    slug: "tvs",
    name: "Transvaginal Sonography (TVS)",
    category: "Advanced",
    duration: "4 Weeks",
    fee: 35000,
    discountFee: 25000,
    mode: "Online/Offline/Both",
    eligibility: "MBBS / Gynaecologists / Sonologists",
    shortDescription:
      "Specialised TVS training — early pregnancy, gynaecological pelvis and infertility workup.",
    description:
      "A focused transvaginal sonography course covering probe handling, early pregnancy assessment, detailed pelvic anatomy, follicular studies and common gynaecological pathology, with daily live scanning.",
    syllabus: [
      "TVS probe handling & safety",
      "Early pregnancy & ectopic assessment",
      "Uterus, endometrium & adnexa",
      "Follicular monitoring & infertility workup",
      "TVS reporting protocols",
    ],
    outcomes: [
      "Perform safe and structured TVS examinations",
      "Diagnose early pregnancy and common pelvic pathology",
      "Support infertility workups with follicular studies",
    ],
  },
  {
    slug: "admu",
    name: "Advanced Diploma in Medical Ultrasound (ADMU)",
    category: "Diploma / Masters",
    duration: "12–18 Months",
    fee: 160000,
    discountFee: 150000,
    mode: "Online/Offline/Both",
    eligibility: "MBBS or equivalent medical graduate, or DMU-completed professionals",
    shortDescription:
      "Advanced-level ultrasound training in Cardiac, 3D/4D, Vascular and Musculoskeletal imaging.",
    description:
      "The Advanced Diploma in Medical Ultrasound (ADMU) is an upper-level program for clinicians who have completed DMU or a basic ultrasound course and want deeper clinical practice. Combines structured theory with extensive hands-on training across advanced modalities. Registration/admission fee: ৳40,000 (payable at admission).",
    syllabus: [
      "3D/4D ultrasound techniques",
      "Advanced Doppler & fetal scanning",
      "Cardiac & vascular ultrasound",
      "Musculoskeletal ultrasound applications",
      "Clinical case studies & research module",
    ],
    outcomes: [
      "Advanced Diploma in Medical Ultrasound (ADMU) certificate",
      "Hands-on clinical training certificate",
      "Enhanced opportunities in diagnostic centres and hospitals",
    ],
    featured: true,
  },
  {
    slug: "dmu",
    name: "Diploma in Medical Ultrasound (DMU)",
    category: "Diploma / Masters",
    duration: "12 Months",
    fee: 110000,
    discountFee: 90000,
    mode: "Offline",
    eligibility: "MBBS / BDS doctors, medical officers, CCD-completed physicians",
    shortDescription:
      "Comprehensive diploma taking MBBS doctors from basic to advanced ultrasound scanning and reporting.",
    description:
      "The Diploma in Medical Ultrasound (DMU) is designed for MBBS doctors building a specialised career in sonography. Follows an international-standard syllabus with in-depth theory and extended hands-on practice, so graduates can independently scan complex cases and produce accurate reports. Government of Bangladesh-approved certification on completion.",
    syllabus: [
      "Advanced ultrasound physics & instrumentation",
      "Abdominal ultrasound (hepatobiliary, pancreas, spleen, GI)",
      "KUB — kidney, ureter & bladder imaging",
      "Obs & Gynae ultrasound (all trimesters, basic anomaly)",
      "Doppler — obstetric, carotid & peripheral vascular",
      "Small parts — thyroid, breast, scrotum & soft tissue",
      "Reporting, documentation & image standards",
    ],
    outcomes: [
      "Independently perform and report complex ultrasound studies",
      "Government-approved DMU certificate",
      "Career support and pathway to advanced (ADMU) training",
    ],
    featured: true,
  },
  {
    slug: "diploma-obs-gynae",
    name: "Diploma in Obs/Gynae",
    category: "Diploma / Masters",
    duration: "12 Months",
    fee: 75000,
    discountFee: 75000,
    mode: "Online/Offline/Both",
    eligibility: "MBBS / BDS graduates and obstetric practitioners",
    shortDescription:
      "Structured diploma in obstetric and gynaecological practice with focused sonography training.",
    description:
      "A twelve-month diploma covering obstetric and gynaecological practice — antenatal care, common gynae conditions, and trimester-wise obstetric sonography — with a strong hands-on component alongside senior consultants.",
    syllabus: [
      "Antenatal & postnatal care",
      "Common gynaecological conditions",
      "Obstetric ultrasound — all trimesters",
      "Gynaecological pelvic scanning",
      "Case-based reporting practice",
    ],
    outcomes: [
      "Diploma in Obs/Gynae certificate",
      "Confident obstetric and gynae clinical assessment",
      "Independent trimester-wise obstetric scanning",
    ],
  },
  {
    slug: "pg-diploma-ultrasound",
    name: "Post Graduate Diploma in Medical Ultrasound",
    category: "Diploma / Masters",
    duration: "12 Months",
    fee: 80000,
    discountFee: 80000,
    mode: "Offline",
    eligibility: "MBBS / BDS graduates and medical officers",
    shortDescription:
      "Post-graduate diploma covering the full spectrum of diagnostic ultrasound with daily hands-on practice.",
    description:
      "A post-graduate diploma for doctors seeking a formal qualification in diagnostic ultrasound. Combines structured theory with daily live-patient scanning across abdominal, obstetric, small-parts and Doppler imaging, mentored by senior sonologists.",
    syllabus: [
      "Ultrasound physics, instrumentation & safety",
      "Abdominal & KUB ultrasound",
      "Obstetric & gynaecological ultrasound",
      "Small parts & superficial structures",
      "Basic Doppler applications",
      "Structured reporting & documentation",
    ],
    outcomes: [
      "Post Graduate Diploma in Medical Ultrasound certificate",
      "Independently perform routine and advanced ultrasound studies",
      "Ready for practice in diagnostic centres and hospitals",
    ],
  },
];

export const courses: Course[] = courseSeeds.map((c) => ({
  ...c,
  syllabusMode: c.syllabusMode ?? "flat",
  syllabusSemesters: c.syllabusSemesters ?? [],
  admissionFee: c.admissionFee ?? 0,
  whatsIncluded:
    c.whatsIncluded && c.whatsIncluded.length > 0
      ? c.whatsIncluded
      : DEFAULT_COURSE_WHATS_INCLUDED,
}));

export const courseCategories = [
  { name: "Foundation", slug: "foundation", description: "Start your ultrasound journey" },
  { name: "Advanced", slug: "advanced", description: "Deepen your diagnostic skill" },
  { name: "Specialty", slug: "specialty", description: "Focused, organ-system training" },
  {
    name: "Diploma / Masters",
    slug: "diploma-masters",
    description: "Long-form diploma & post-graduate programs",
  },
] as const;

export type CourseCategoryName = (typeof courseCategories)[number]["name"];
export type CourseCategorySlug = (typeof courseCategories)[number]["slug"];

export function getCategoryBySlug(slug: string) {
  return courseCategories.find((c) => c.slug === slug);
}

export function getCategorySlug(name: string) {
  return courseCategories.find((c) => c.name === name)?.slug;
}

export const coursesPage = {
  meta: {
    title: "Course Catalog — CMUD Ultrasound Programs",
    description:
      "Browse all ultrasound and Doppler training programs at CMUD — foundation, advanced, and specialty courses.",
    ogTitle: "Course Catalog — CMUD",
    ogDescription: "Foundation, advanced, and specialty ultrasound programs at CMUD.",
  },
  hero: {
    eyebrow: "Course Catalog",
    title: "Programs in medical ultrasound & Doppler.",
    description:
      "Choose a course that fits your level and clinical focus. All programs combine daily hands-on scanning with structured theory and reporting.",
  },
  filters: ["All", "Foundation", "Advanced", "Specialty", "Diploma / Masters"] as const,
  filterLabel: {
    All: "All",
    Foundation: "Foundation",
    Advanced: "Advanced",
    Specialty: "Specialty",
    "Diploma / Masters": "Diploma",
  } as const,
};

export const courseDetailPage = {
  feeLabel: "Course Fee",
  admissionFeeLabel: "Admission Fee",
  savingsSuffix: "— limited-time admission offer",
  applyLabel: "Apply for this course",
  seatsNote: "Limited seats per batch. Speak to admissions for instalment options.",
  sections: {
    syllabus: "Syllabus / Module",
    syllabusWithCount: (count: number) => `Syllabus / Module (${count})`,
    outcomes: "Learning outcomes",
    whatsIncluded: "What's included in the course",
    eligibility: "Eligibility",
  },
  notFound: {
    title: "Course not found",
    cta: "Browse all courses",
  },
  error: {
    title: "Something went wrong",
    cta: "Browse all courses",
  },
  imagePlaceholder: "Course image coming soon",
};

export function getCourse(slug: string) {
  return courses.find((c) => c.slug === slug);
}
