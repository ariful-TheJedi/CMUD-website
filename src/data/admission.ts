export const admissionPage = {
  meta: {
    title: "Admission & Enrollment — CMUD",
    description:
      "Apply for admission at CMUD. Fill the enrollment form and our admissions team will get in touch with batch details.",
    ogTitle: "Admission & Enrollment — CMUD",
    ogDescription: "Apply for CMUD ultrasound programs.",
  },
  hero: {
    eyebrow: "Admission",
    title: "Apply to CMUD",
    description:
      "Fill the form and our admissions team will reach out with batch dates, fee schedule, and document requirements.",
  },
  labels: {
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    qualification: "Qualification",
    medicalCollege: "Medical College",
    bmdcNumber: "BMDC number",
    preferredBranch: "Preferred Branch",
    course: "Course",
    preferredBatch: "Preferred batch",
    howDidYouFindUs: "How did you find us?",
    address: "Address",
    message: "Message",
  },
  branches: [
    { value: "Panthapath", label: "Panthapath" },
    { value: "Uttara", label: "Uttara" },
  ],
  batches: [
    { value: "Sept-2026", label: "September 2026" },
    { value: "nov-2026", label: "November 2026" },
    { value: "jan-2027", label: "January 2027" },
    { value: "may-2027", label: "May 2027" },
    { value: "cmu", label: "CMU batch" },
  ],
  findUsOptions: [
    { value: "Website search", label: "Website search" },
    {
      value: "Social media (Facebook, Instagram, YouTube etc.)",
      label: "Social media (Facebook, Instagram, YouTube etc.)",
    },
    { value: "Md. Hridoy Ali", label: "Md. Hridoy Ali" },
    { value: "Shawon Mahmud", label: "Shawon Mahmud" },
    { value: "Md. Sumon", label: "Md. Sumon" },
    { value: "Abir Hossain", label: "Abir Hossain" },
  ],
  placeholders: {
    fullName: "Dr Kawser Mahmood",
    email: "you@example.com",
    phone: "+88017823XXXXX",
    qualification: "MBBS / MD / Other",
    medicalCollege: "Name of medical college",
    bmdcNumber: "e.g. A-12345",
    preferredBranch: "Select preferred branch",
    course: "Choose a course",
    preferredBatch: "Choose batch",
    howDidYouFindUs: "Select an option",
    address: "City, country",
    message: "Tell us about your background and goals",
  },
  submit: {
    idle: "Submit application",
    submitting: "Submitting…",
  },
  success: {
    toastTitle: "Application received",
    toastDescription: "Our admissions team will contact you within one business day.",
    banner:
      "Application received. Our admissions team will contact you within one business day.",
  },
  errors: {
    captcha: "Please complete the security check",
    submitTitle: "Submission failed",
    submitDescription: "Please check your details and try again.",
  },
};
