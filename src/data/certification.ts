export const certificationPage = {
  meta: {
    title: "Certification — CMUD",
    description:
      "How CMUD certification works — assessment, requirements, and recognition by partner hospitals.",
    ogTitle: "Certification — CMUD",
    ogDescription: "How CMUD certification is awarded and recognised.",
  },
  hero: {
    eyebrow: "Certification",
    title: "Earn a CMUD certificate that hospitals recognise.",
  },
  steps: [
    {
      icon: "graduationCap" as const,
      title: "Complete the course",
      text: "Attend all theory, scanning, and reporting sessions.",
    },
    {
      icon: "fileCheck" as const,
      title: "Pass the assessment",
      text: "Written test + practical scanning evaluation.",
    },
    {
      icon: "badgeCheck" as const,
      title: "Submit case log",
      text: "Minimum number of supervised, signed-off cases.",
    },
    {
      icon: "award" as const,
      title: "Receive certificate",
      text: "CMUD certificate issued and added to our alumni registry.",
    },
  ],
  recognition: {
    title: "Recognition & standards",
    body: "Our programs align with internationally accepted protocols (ISUOG for OB-GYN, ASUM for general ultrasound, ACEP for emergency POCUS). Certificates carry the CMUD seal and unique verification ID and are recognised by partner hospitals and diagnostic centres.",
    ctaLabel: "Start your application",
    ctaTo: "/admission" as const,
  },
};
