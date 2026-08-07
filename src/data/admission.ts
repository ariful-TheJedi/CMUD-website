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
  branches: [
    { value: "Panthapath", label: "Panthapath" },
    { value: "Uttara", label: "Uttara" },
  ],
  batches: [
    { value: "jul-2026", label: "July 2026" },
    { value: "oct-2026", label: "October 2026" },
    { value: "jan-2027", label: "January 2027" },
  ],
  placeholders: {
    fullName: "Dr. Ramesh Sharma",
    email: "you@example.com",
    phone: "+88017823XXXXX",
    qualification: "MBBS / MD / Other",
    medicalCollege: "Name of medical college",
    bmdcNumber: "e.g. A-12345",
    address: "City, country",
    message: "Tell us about your background and goals",
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
