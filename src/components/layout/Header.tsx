import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sharedMedia } from "@/data/shared";

const contactLinks = [
  { label: "WhatsApp / Phone", href: "https://wa.me/8801974557777" },
  { label: "Email", href: "mailto:info@cmudusg.com" },
] as const;

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com/CMUDBD", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  { label: "YouTube", href: "https://www.youtube.com/@CMUD", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
] as const;

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/faculty", label: "Faculty" },
  { to: "/education-aides", label: "Education Aides" },
  { to: "/notices", label: "Notices" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="hidden border-b border-border/50 bg-muted/50 lg:block">
        <div className="container mx-auto flex min-h-9 flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-1 text-xs text-muted-foreground sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
            {contactLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                {item.label === "Email" ? (
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <span className="inline-flex items-center gap-1" aria-hidden="true">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.53 0 .2 5.32.2 11.87c0 2.1.55 4.15 1.59 5.96L.1 24l6.33-1.66a11.9 11.9 0 0 0 5.65 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.45-8.42ZM12.09 21.76h-.01a9.88 9.88 0 0 1-5.03-1.37l-.36-.21-3.76.99 1-3.66-.24-.38a9.84 9.84 0 0 1-1.52-5.26c0-5.46 4.45-9.9 9.92-9.9a9.84 9.84 0 0 1 7.01 2.9 9.84 9.84 0 0 1 2.9 7.02c0 5.47-4.45 9.91-9.91 9.91Zm5.44-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                    </svg>
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                )}
                <span>{item.label === "Email" ? "info@cmudusg.com" : "+880 1974557777"}</span>
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={item.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
          <img
            src={sharedMedia.headerLogo}
            alt="CMUD"
            className="h-10 w-auto object-contain"
            width="120"
            height="40"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
              activeOptions={{ exact: n.to === "/" }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden md:inline-flex">
            <Link to="/admission" search={{}}>
              Apply Now
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-72 flex-col">
              <div className="mt-8 flex flex-col gap-1">
                {nav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
                    activeOptions={{ exact: n.to === "/" }}
                    activeProps={{ className: "bg-accent text-accent-foreground" }}
                  >
                    {n.label}
                  </Link>
                ))}
                <Button asChild className="mt-4">
                  <Link to="/admission" search={{}} onClick={() => setOpen(false)}>
                    Apply Now
                  </Link>
                </Button>
              </div>
              <div className="mt-auto border-t border-border pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Get in touch</p>
                <div className="flex flex-col gap-3 text-sm">
                  {contactLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-2 text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {item.label === "Email" ? (
                        <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1" aria-hidden="true">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.53 0 .2 5.32.2 11.87c0 2.1.55 4.15 1.59 5.96L.1 24l6.33-1.66a11.9 11.9 0 0 0 5.65 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.45-8.42ZM12.09 21.76h-.01a9.88 9.88 0 0 1-5.03-1.37l-.36-.21-3.76.99 1-3.66-.24-.38a9.84 9.84 0 0 1-1.52-5.26c0-5.46 4.45-9.9 9.92-9.9a9.84 9.84 0 0 1 7.01 2.9 9.84 9.84 0 0 1 2.9 7.02c0 5.47-4.45 9.91-9.91 9.91Zm5.44-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                          </svg>
                          <Phone className="h-4 w-4" />
                        </span>
                      )}
                      <span>{item.label === "Email" ? "info@cmudusg.com" : "+880 1974557777"}</span>
                    </a>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4">
                  {socialLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d={item.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
