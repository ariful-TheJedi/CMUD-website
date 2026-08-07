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
  info: [
    {
      icon: "mapPin" as const,
      title: "Panthapath Branch",
      text: "Holding No. 66, Razanighanda Complex, Bir Uttam K. M. Shafiullah Road, Green Road (Panthapath), Dhaka – 1205",
    },
    {
      icon: "mapPin" as const,
      title: "Uttara Branch",
      text: "House 06, Sonargaon Jonopath Road, Sector 11 Uttara, Dhaka",
    },
    {
      icon: "phone" as const,
      title: "Call us",
      text: "Admissions: +880 1826-306254, +880 1974-557777\nOffice: +880 17xxxxxx (Uttara), +880 16xxxxx (Panthapath)",
    },
    {
      icon: "mail" as const,
      title: "Email",
      text: "info@cmudusg.com\nwww.cmudusg.com",
    },
    {
      icon: "clock" as const,
      title: "Office hours",
      text: "9:00 AM – 10:00 PM\nEvery day",
    },
  ],
  /** Compact contact details reused by the site footer */
  footer: {
    logo: "/media/shared/cmud-light-sea-green-transparent.png",
    panthapath: "Panthapath: Holding No. 66, Razanighanda Complex, Green Road, Dhaka – 1205",
    uttara: "Uttara: House 06, Sonargaon Jonopath Road, Sector 11, Dhaka",
    phones: ["+880 1826-306254", "+880 1974-557777"],
    email: "info@cmudusg.com",
  },
};
