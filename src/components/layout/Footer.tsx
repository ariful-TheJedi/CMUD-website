import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { contactPage } from "@/data/contact";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-serif text-xl font-bold">
            <img
              src={contactPage.footer.logo}
              alt="CMUD"
              className="h-[38px] w-auto object-contain"
              width="128"
              height="38"
            />
          </div>
          <p className="mt-3 text-sm text-primary-foreground/70">
            College of Medical Ultrasound & Doppler — hands-on professional training in diagnostic
            imaging since 2014.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Programs</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li>
              <Link to="/courses" className="hover:text-primary-foreground">
                All Courses
              </Link>
            </li>
            <li>
              <Link to="/certification" className="hover:text-primary-foreground">
                Certification
              </Link>
            </li>
            <li>
              <Link to="/admission" search={{}} className="hover:text-primary-foreground">
                Admission
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-primary-foreground">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/certificate-check" className="hover:text-primary-foreground">
                Certificate Check
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Institute</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li>
              <Link to="/about" className="hover:text-primary-foreground">
                About CMUD
              </Link>
            </li>
            <li>
              <Link to="/faculty" className="hover:text-primary-foreground">
                Faculty
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:text-primary-foreground">
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/testimonials" className="hover:text-primary-foreground">
                Testimonials
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {contactPage.footer.panthapath}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {contactPage.footer.uttara}
            </li>
            {contactPage.footer.phones.map((phone) => (
              <li key={phone} className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> {phone}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" /> {contactPage.footer.email}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row">
          <span>© {new Date().getFullYear()} CMUD. All rights reserved.</span>
          <span>Built for medical educators and trainees.</span>
        </div>
      </div>
    </footer>
  );
}
