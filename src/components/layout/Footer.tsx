import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { footerData } from "@/data/footer";
import { assetUrl } from "@/lib/assets";

export function Footer() {
  const { logo, logoAlt, blurb, programs, institute, contact, bottom } = footerData;

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
