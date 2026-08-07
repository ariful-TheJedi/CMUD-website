/**
 * Static Home page copy for sections that are NOT CMS-managed.
 * Hero + Hands-on Ultrasound Training stay in the database
 * (`page_content` / `defaultHomeContent`) — do not add them here.
 */

export const homePage = {
  /** Image fallbacks when CMS hero / hands-on imageUrl is empty */
  media: {
    heroFallback: "/media/home/hero-ultrasound.jpg",
    handsOnFallback: "/media/home/hands-on-training.jpg",
  },

  whyCmud: {
    eyebrow: "Why CMUD",
    title: "Built around scanning, not slides.",
    description:
      "For every Classroom, CMUD has twice the number of practical rooms. Learn with a probe in hand, not in a lecture hall.",
    features: [
      {
        icon: "hand" as const,
        title: "Hands-on Scanning",
        text: "2+ hours of daily live scanning with real patients in every program.",
      },
      {
        icon: "users" as const,
        title: "Expert Faculty",
        text: "Senior radiologists, cardiologists, and OB-GYN specialists.",
      },
      {
        icon: "award" as const,
        title: "Recognised Certification",
        text: "Structured assessment and CMUD certificate on completion.",
      },
      {
        icon: "microscope" as const,
        title: "Modern Equipment",
        text: "High-end ultrasound and Doppler machines for training.",
      },
    ],
  },

  featuredCourses: {
    eyebrow: "Featured Courses",
    title: "Programs starting this batch",
    description: "Limited seats per batch to ensure consistent hands-on time.",
    ctaLabel: "Browse all courses",
    ctaTo: "/courses" as const,
  },

  categories: {
    eyebrow: "Course Categories",
    title: "Find the right path for your level.",
    exploreLabel: "Explore",
    icons: {
      Foundation: "compass" as const,
      Advanced: "radar" as const,
      Specialty: "heartPulse" as const,
      "Diploma / Masters": "scrollText" as const,
    },
  },

  facultyPreview: {
    eyebrow: "Meet the Faculty",
    title: "Senior consultants. Patient teachers.",
    ctaLabel: "See all faculty",
    ctaTo: "/faculty" as const,
    limit: 3,
  },

  notices: {
    eyebrow: "Notice Board",
    title: "Latest updates & routines",
    ctaLabel: "All notices",
    ctaTo: "/notices" as const,
    limit: 3,
  },

  testimonials: {
    eyebrow: "From our graduates",
    title: "A community of confident sonologists.",
    limit: 4,
  },

  contactCta: {
    title: "Visit CMUD or talk to admissions.",
    description:
      "Our team is happy to walk you through programs, schedules, and fees in person or over a call.",
    primaryCtaLabel: "Apply Now",
    primaryCtaTo: "/admission" as const,
    secondaryCtaLabel: "Contact us",
    secondaryCtaTo: "/contact" as const,
    location: "Panthapath & Uttara, Dhaka",
    hours: "9:00 AM – 10:00 PM · Every day",
    whatsapp: "+880 1826-306254",
    facebook: "/cmudusg",
    youtube: "/cmudusg",
    phoneEmail: "+880 1826-306254 · info@cmudusg.com",
  },
};
