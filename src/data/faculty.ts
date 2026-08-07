export type Instructor = {
  name: string;
  title: string;
  credentials: string;
  bio: string;
  initials: string;
  photo?: string;
};

export const faculty: Instructor[] = [
  {
    name: "Dr. A B M Sarwar Jahan",
    title: "PAIN MEDICINE AND MSK LEAD ",
    credentials:
      "MBBS, D A FIPM (India), MSK USG (India), Fellowship in MSK USG in Pain Med (Ind), Bangladesh Medical University",
    bio: "Over 18 years of diagnostic imaging experience. Lead trainer for obstetric and fetal medicine programs.",
    initials: "SJ",
    photo: "/media/faculty/sarwar-jahan-cropped-3x4.5.png",
  },
  {
    name: "Dr. Mashrima Morshed Mishi",
    title: "OBS AND GYNAE LEAD",
    credentials:
      "MBBS, BCS 39, MS (Obs and Gynae) DMCH, FCPS P2, Reproductive Endocrinology $ infertility, MRCOG P1(UK)",
    bio: "Young and Emerging Lead mentor in Diploma in OBS Gyane",
    initials: "MM",
  },
  {
    name: "Dr. M Nazmul Haque",
    title: "ASSISTANT PROFESSOR — MEDICAL COLLEGE HOSPITAL",
    credentials: "MBBS, MCPS(Medicine), D-CARD",
    bio: "Cardiology and Medicine specialist. scanning with 12+ years in tertiary care.",
    initials: "NH",
    photo: "/media/faculty/nazmul-cropped-3x4.5.png",
  },
  {
    name: "Dr. Azim Anwar",
    title: "Consultant Cardiologist",
    credentials: "MBBS, MD, MRCP (UK)",
    bio: "Cardiology and Medicine specialist. Leads our echocardiography modules with a focus on practical bedside skill.",
    initials: "AA",
  },
  {
    name: "Dr. Sudipta Sarkar Shuvra",
    title: "DMU, POCUS FACULTY",
    credentials: "MBBS (BUP), DMU, PGT in Radiology and Imaging (DMCH)",
    bio: "Govt hospital",
    initials: "SS",
    photo: "/media/faculty/dr_sudipta-cropped-3x4.5.png",
  },
  {
    name: "Dr. Arina Parvin",
    title: "PERMANENT FACULTY, TVS AND DMU",
    credentials: "MBBS, DMU, Saline infusion Sonography (India)",
    bio: "Makes ultrasound physics intuitive through demonstrations and live phantom work.",
    initials: "AP",
    photo: "/media/faculty/dr_Arina_Parvin-cropped-3x4.5.png",
  },
  {
    name: "Dr. Auditi Debnath",
    title: "MD AND PERMANENT FACULTY",
    credentials: "MBBS (DU), DMU (CMUD), CCD (BIRDEM), PGT (Radiology and Imaging, DMCH)",
    bio: "Trained in TVS, Color Doppler Study and Anomaly Scan.",
    initials: "AD",
    photo: "/media/faculty/dr_auditi_debnath-cropped-3x4.5.png",
  },
  {
    name: "Dr. Shaheen Akhter",
    title: "MANAGING DIR, PERMANENT FACULTY",
    credentials: "MBBS, DMU, MPH, PGDMU",
    bio: "Consultant Sonologist, Thyroid Clinic.",
    initials: "SA",
    photo: "/media/faculty/dr_shaheen-cropped-3x4.5.png",
  },
  {
    name: "Prof. Dr. Farida Yeasmin Shelley",
    title: "PROFESSOR, SCHOOL OF SCIENCE & TECH (EX.), OPEN UNI",
    credentials: "Faculty, PGDMU Program",
    bio: "Center for Medical Ultrasound & Doppler (CMUD).",
    initials: "FS",
  },
  {
    name: "Dr. Mohammad Rezaul Kabir",
    title: "Faculty Member of CMUD",
    credentials: "MBBS, BCS (Health), MD (Radiology & Imaging)",
    bio: "Consultant Sonologist of Thyroid Clinic.",
    initials: "RK",
  },
  {
    name: "Dr. Ferdous Akhter",
    title: "ADDVISOR, LEAD ",
    credentials: "MBBS, DMU, PGDMU, TVS",
    bio: "Senior Medical Officer, Ministry of Labor.",
    initials: "FA",
  },
  {
    name: "Dr. Subrata Bhowmik",
    title: "ADMU, DMU, DOPPLER LEAD",
    credentials:
      "MBBS, BCS, CCD (Diabetes) (BIRDEM), DOC (Dermatology), FCPS (Medicine) (Final Part), MD (Cardiology) (Course) (BSMMU), DMU",
    bio: "Consultant Sonologist, Thyroid Clinic.",
    initials: "SB",
    photo: "/media/faculty/dr_subrata_bhowmik-cropped-3x4.5.png",
  },
  {
    name: "Dr. Shirina Yeasmin",
    title: "Faculty, Center for Medical Ultrasound & Doppler (CMUD)",
    credentials: "MBBS (Dhaka), CCD, DMU, PGT (Gynecology & OBS)",
    bio: "Specially Trained in TVS & Color Doppler. Consultant Sonologist, Thyroid Clinic.",
    initials: "SY",
  },
  {
    name: "Dr. Farzana Alam",
    title: "LEAD IN ADVANCED COURSES, DMU",
    credentials: "MBBS, PGDMU",
    bio: "Specially Trained in TVS and Color Doppler, Anomaly Scan. Consultant Sonologist, Thyroid Clinic.",
    initials: "FL",
    photo: "/media/faculty/dr_farzana-cropped-3x4.5.png",
  },
  {
    name: "Dr. Rahela Akhter Liza",
    title: "Faculty of Center for Medical Ultrasound & Doppler (CMUD)",
    credentials: "MBBS (Dhaka), PGT (Gynae & OBS), CCD (Diabetes), DMU (CMUD)",
    bio: "Experienced in Gynae, Infertility, Breast, Thyroid & Skin Diseases. Consultant Sonologist, Thyroid Clinic.",
    initials: "RL",
  },
  {
    name: "Dr. Sharmin Binte Seraz",
    title: "Assistant Professor, Dr. M R Khan Shishu Hospital & Institute of Child Health",
    credentials: "MBBS, MS (Pediatric surgery)",
    bio: "Faculty of Center for Medical Ultrasound & Doppler (CMUD).",
    initials: "SR",
  },
  {
    name: "Dr. Farzana Kabir",
    title: "Faculty of Center for Medical Ultrasound & Doppler (CMUD)",
    credentials: "MBBS (DMC), FCPS (Child), MCPS (Child)",
    bio: "Consultant Sonologist, Thyroid Clinic.",
    initials: "FK",
  },
];

export const facultyPage = {
  meta: {
    title: "Faculty & Instructors — CMUD",
    description:
      "Meet the senior radiologists, cardiologists, and OB-GYN specialists who lead training at CMUD.",
    ogTitle: "Faculty & Instructors — CMUD",
    ogDescription: "Senior consultants who lead training at CMUD.",
  },
  hero: {
    eyebrow: "Faculty",
    title: "Clinicians who teach.",
    description: "Our faculty are practising consultants who bring real cases into every session.",
  },
};
