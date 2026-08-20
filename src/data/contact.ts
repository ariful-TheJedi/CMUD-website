export const contactPage = {
  meta: {
    title: "Contact & Location — CMUD",
    description: "Visit, call, or email CMUD. Our admissions team is available Monday to Saturday.",
    ogTitle: "Contact & Location — CMUD",
    ogDescription: "Visit, call, or email CMUD admissions.",
  },
  hero: {
    eyebrow: "Contact",
    title: "Get in touch with CMUD",
    description:
      "Talk to our admissions team about programs, fees, or visit us at our Panthapath or Uttara campus.",
  },
  campuses: [
    {
      title: "Panthapath Branch",
      address:
        "Holding No. 66, Razanighanda Complex, Bir Uttam K. M. Shafiullah Road, Green Road (Panthapath), Dhaka – 1205",
      mapsUrl: "https://maps.app.goo.gl/utxb96ziku1dfM8w9",
      lat: 23.7500591,
      lng: 90.3869046,
    },
    {
      title: "Uttara Branch",
      address: "House 06, Sonargaon Jonopath Road, Sector 11 Uttara, Dhaka",
      mapsUrl: "https://maps.app.goo.gl/4VT1VeEBG5a62Fhz7",
      lat: 23.874568,
      lng: 90.3928031,
    },
  ],
  channels: [
    {
      icon: "phone" as const,
      title: "Call us",
      lines: [
        { label: "Admissions", value: "+880 1826-306254", href: "tel:+8801826306254" },
        { label: "Admissions", value: "+880 1974-557777", href: "tel:+8801974557777" },
      ],
      note: "Office lines for Uttara and Panthapath available on request.",
    },
    {
      icon: "mail" as const,
      title: "Email",
      lines: [
        { label: "General", value: "info@cmudusg.com", href: "mailto:info@cmudusg.com" },
        { label: "secondary", value: "cmudoffice@gmail.com", href: "mailto:cmudoffice@gmail.com" },
      ],
    },
    {
      icon: "clock" as const,
      title: "Office hours",
      lines: [{ label: "Open", value: "9:00 AM – 10:00 PM" }],
      note: "Every day",
    },
  ],
  map: {
    eyebrow: "Find us",
    title: "Campus locations",
    description: "Panthapath and Uttara marked on one map.",
  },
  /** Compact contact details reused by the site footer */
  footer: {
    logo: "/media/shared/cmud-light-sea-green-transparent.png",
    panthapath: "Panthapath: Holding No. 66, Razanighanda Complex, Green Road, Dhaka – 1205",
    uttara: "Uttara: House 06, Sonargaon Jonopath Road, Sector 11, Dhaka",
    phones: ["+880 1826-306254", "+880 1974-557777"],
    email: "info@cmudusg.com",
  },
};
