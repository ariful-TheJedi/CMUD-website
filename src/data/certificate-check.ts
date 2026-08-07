export const certificateCheckPage = {
  meta: {
    title: "Certificate Check — CMUD",
    description:
      "Verify the authenticity of a CMUD certificate by entering the certificate number or BMDC number.",
    ogTitle: "Certificate Check — CMUD",
    ogDescription: "Verify the authenticity of a CMUD certificate.",
  },
  hero: {
    eyebrow: "Verification",
    title: "Certificate Check",
    description:
      "Enter a CMUD Certificate No or BMDC No to verify authenticity. If you cannot find your certificate, please contact our admissions office.",
  },
  lookup: {
    certificate: {
      label: "Certificate No",
      placeholder: "e.g. 202603XXX",
      helper: "The Certificate No is printed on the bottom of your CMUD certificate.",
    },
    bmdc: {
      label: "BMDC No",
      placeholder: "e.g. A-12345",
      helper: "Enter the BMDC registration number of the student.",
    },
  },
  messages: {
    verifyIdle: "Verify",
    verifying: "Verifying…",
    error: "Unable to verify at this time. Please try again shortly.",
    noMatchTitle: "Not verified",
    noMatchBody:
      "We could not verify a certificate for this identifier. Please double-check the exact number or contact info@cmudusg.com.",
    verifiedLabel: "Verified authentic",
  },
};
