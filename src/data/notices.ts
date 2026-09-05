export type Notice = {
  date: string;
  title: string;
  body: string;
  tag: "Notice" | "Routine" | "Result" | "Event";
};

export const notices: Notice[] = [
  {
    date: "2026-06-25",
    title: "Admissions open: July 2026 batch",
    body: "Apply now for the July intake of Basic Ultrasound, Advanced Doppler, and OB-GYN Ultrasound. Limited seats per batch to ensure quality hands-on time.",
    tag: "Notice",
  },
  {
    date: "2026-06-20",
    title: "Routine: Doppler Imaging — Batch 14",
    body: "Theory 7–9 AM, Hands-on 9–11 AM, Monday to Friday. Reporting workshop on Saturdays.",
    tag: "Routine",
  },
  {
    date: "2026-06-18",
    title: "Results published: April 2026 batch",
    body: "Certificates can be collected from the CMUD administrative office after June 30, 2026.",
    tag: "Result",
  },
  {
    date: "2026-06-10",
    title: "Workshop: Fetal Echocardiography",
    body: "Two-day intensive workshop with international faculty on July 12–13, 2026.",
    tag: "Event",
  },
  {
    date: "2026-05-30",
    title: "New MSK ultrasound batch starting",
    body: "Limited 12 seats. Includes live model scanning and USG-guided injection practice.",
    tag: "Notice",
  },
];

export const noticesPage = {
  meta: {
    title: "Notice Board & Routine — CMUD",
    description: "Latest notices, routines, results, and events at CMUD.",
    ogTitle: "Notice Board & Routine — CMUD",
    ogDescription: "Latest CMUD notices, routines, results, and events.",
  },
  hero: {
    eyebrow: "Notice Board",
    title: "Notices & routines",
    description: "Stay up to date with admissions, batch routines, results, and CMUD events.",
  },
  emptyState: "No notices yet.",
};
