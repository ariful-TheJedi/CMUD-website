import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sharedMedia } from "@/data/shared";

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
            <SheetContent side="right" className="w-72">
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
