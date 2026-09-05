/**
 * Site footer copy + links (layout only — not CMS/Postgres).
 */

export const footerData = {
  logo: "/media/shared/cmud-light-sea-green-transparent.png",
  logoAlt: "CMUD",
  blurb:
    "College of Medical Ultrasound & Doppler — hands-on professional training in diagnostic imaging since 2008.",
  programs: {
    title: "Programs",
    links: [
      { label: "All Courses", to: "/courses" as const },
      { label: "Certification", to: "/certification" as const },
      { label: "Admission", to: "/admission" as const, search: {} as const },
      { label: "FAQ", to: "/faq" as const },
      { label: "Certificate Check", to: "/certificate-check" as const },
    ],
  },
  institute: {
    title: "Institute",
    links: [
      { label: "About CMUD", to: "/about" as const },
      { label: "Faculty", to: "/faculty" as const },
      { label: "Gallery", to: "/gallery" as const },
      { label: "Testimonials", to: "/testimonials" as const },
    ],
  },
  contact: {
    title: "Contact",
    panthapath: "Panthapath: Holding No. 66, Razanighanda Complex, Green Road, Dhaka – 1205",
    uttara: "Uttara: House 06, Sonargaon Jonopath Road, Sector 11, Dhaka",
    phones: ["+880 1944333666", "+880 1974-557777"],
    email: "info@cmudusg.com",
  },
  bottom: {
    copyrightSuffix: "CMUD. All rights reserved.",
    tagline: "Built for medical educators and trainees.",
  },
};
