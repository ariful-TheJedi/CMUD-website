export type Testimonial = {
  name: string;
  role: string;
  quote: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Dr. Sneha Maharjan",
    role: "Radiology Resident",
    quote:
      "The hands-on hours at CMUD are unmatched. I scanned more patients here in three months than I had in my first year of residency.",
    initials: "SM",
  },
  {
    name: "Dr. Ashok Bhandari",
    role: "General Practitioner",
    quote:
      "Faculty are approachable and the structured reporting templates have changed how I work in my clinic.",
    initials: "AB",
  },
  {
    name: "Dr. Rekha Joshi",
    role: "OB-GYN Consultant",
    quote:
      "The OB-GYN module is rigorous and protocol-driven. I now feel fully confident with anomaly scans.",
    initials: "RJ",
  },
  {
    name: "Dr. Manish Khatri",
    role: "Emergency Physician",
    quote:
      "POCUS at CMUD changed how I make decisions in the ER. Every session was case-driven and practical.",
    initials: "MK",
  },
];

export const testimonialsPage = {
  meta: {
    title: "Testimonials — CMUD Graduates",
    description: "Read what CMUD graduates say about our hands-on ultrasound training.",
    ogTitle: "Testimonials — CMUD Graduates",
    ogDescription: "What CMUD graduates say about our training.",
  },
  hero: {
    eyebrow: "Testimonials",
    title: "What our graduates say",
  },
};
