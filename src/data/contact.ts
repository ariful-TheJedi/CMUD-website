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
  mapEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=90.386%2C23.750%2C90.394%2C23.756&layer=mapnik",
  campuses: [
    {
      title: "Panthapath Branch",
      address:
        "Holding No. 66, Razanighanda Complex, Bir Uttam K. M. Shafiullah Road, Green Road (Panthapath), Dhaka – 1205",
    },
    {
      title: "Uttara Branch",
      address: "House 06, Sonargaon Jonopath Road, Sector 11 Uttara, Dhaka",
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
        { label: "Website", value: "www.cmudusg.com", href: "https://www.cmudusg.com" },
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
    title: "Campus location",
    description: "Visit our Panthapath campus — admissions can also guide you to Uttara.",
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
