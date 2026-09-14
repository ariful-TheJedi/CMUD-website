import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { footerData } from "@/data/footer";
import { assetUrl } from "@/lib/assets";

const socialIconPaths = {
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
} as const;

export function Footer() {
  const { logo, logoAlt, blurb, programs, institute, contact, social, bottom } = footerData;

  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-serif text-xl font-bold">
            <img
              src={assetUrl(logo)}
              alt={logoAlt}
              className="h-[100px] w-auto object-contain"
              width="300"
              height="100"
            />
          </div>
          <p className="mt-3 text-base text-primary-foreground/70 md:text-lg">{blurb}</p>
          <div className="mt-4 flex items-center gap-3">
            {social.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d={socialIconPaths[item.icon]} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold uppercase tracking-wider md:text-lg">
            {programs.title}
          </h3>
          <ul className="mt-4 space-y-2 text-base text-primary-foreground/80 md:text-lg">
            {programs.links.map((link) => (
              <li key={link.to}>
                {"search" in link && link.search != null ? (
                  <Link
                    to={link.to}
                    search={link.search}
                    className="hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <Link to={link.to} className="hover:text-primary-foreground">
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold uppercase tracking-wider md:text-lg">
            {institute.title}
          </h3>
          <ul className="mt-4 space-y-2 text-base text-primary-foreground/80 md:text-lg">
            {institute.links.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-primary-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold uppercase tracking-wider md:text-lg">
            {contact.title}
          </h3>
          <ul className="mt-4 space-y-3 text-base text-primary-foreground/80 md:text-lg">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {contact.panthapath}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {contact.uttara}
            </li>
            {contact.phones.map((phone) => (
              <li key={phone} className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> {phone}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" /> {contact.email}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {bottom.copyrightSuffix}
          </span>
          <span>{bottom.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
