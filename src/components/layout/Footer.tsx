import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
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
    <footer className="mt-24 border-t border-primary-foreground/10 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          
          {/* Column 1: Brand & Social */}
          <div className="flex flex-col items-start pr-4">
            <Link to="/" className="mb-6 inline-block">
              <img
                src={assetUrl(logo)}
                alt={logoAlt}
                className="h-16 w-auto object-contain drop-shadow-sm"
                width="240"
                height="64"
              />
            </Link>
            <p className="text-base leading-relaxed text-primary-foreground/75">
              {blurb}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/5 text-primary-foreground/80 transition-all duration-300 hover:bg-primary-foreground/20 hover:text-primary-foreground hover:-translate-y-1"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d={socialIconPaths[item.icon as keyof typeof socialIconPaths]} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Programs */}
          <div>
            <h3 className="font-sans text-base font-semibold uppercase tracking-wider text-primary-foreground/90 md:text-lg">
              {programs.title}
            </h3>
            <ul className="mt-6 flex flex-col space-y-4">
              {programs.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    search={"search" in link && link.search != null ? link.search : undefined}
                    className="group flex items-center text-base text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                  >
                    <ArrowRight className="mr-2 h-4 w-4 -translate-x-3 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    <span className="-translate-x-6 transition-all duration-300 group-hover:translate-x-0">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Institute */}
          <div>
            <h3 className="font-sans text-base font-semibold uppercase tracking-wider text-primary-foreground/90 md:text-lg">
              {institute.title}
            </h3>
            <ul className="mt-6 flex flex-col space-y-4">
              {institute.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group flex items-center text-base text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                  >
                    <ArrowRight className="mr-2 h-4 w-4 -translate-x-3 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    <span className="-translate-x-6 transition-all duration-300 group-hover:translate-x-0">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-sans text-base font-semibold uppercase tracking-wider text-primary-foreground/90 md:text-lg">
              {contact.title}
            </h3>
            <ul className="mt-6 flex flex-col space-y-4 text-base text-primary-foreground/75">
              <li className="flex items-start gap-3 transition-colors hover:text-primary-foreground">
                <MapPin className="mt-1 h-4 w-4 shrink-0 opacity-80" />
                <span className="leading-relaxed">{contact.panthapath}</span>
              </li>
              <li className="flex items-start gap-3 transition-colors hover:text-primary-foreground">
                <MapPin className="mt-1 h-4 w-4 shrink-0 opacity-80" />
                <span className="leading-relaxed">{contact.uttara}</span>
              </li>
              
              <div className="flex flex-col gap-4 pt-1">
                {contact.phones.map((phone) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="group flex items-center gap-3 transition-colors hover:text-primary-foreground"
                    >
                      <Phone className="h-4 w-4 shrink-0 opacity-80 transition-opacity group-hover:opacity-100" />
                      {phone}
                    </a>
                  </li>
                ))}
              </div>
              
              <li className="pt-1">
                <a
                  href={`mailto:${contact.email}`}
                  className="group flex items-center gap-3 transition-colors hover:text-primary-foreground"
                >
                  <Mail className="h-4 w-4 shrink-0 opacity-80 transition-opacity group-hover:opacity-100" />
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-primary-foreground/10 bg-primary-foreground/5">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row lg:px-8">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} {bottom.copyrightSuffix}
          </p>
          <p className="text-sm font-medium text-primary-foreground/70">
            {bottom.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}