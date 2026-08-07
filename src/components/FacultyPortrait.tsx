import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  initials: string;
  photo?: string;
  /** Tailwind height class, e.g. "h-28" */
  className?: string;
};

/**
 * Faculty portrait in a fixed 3:4.5 frame. Falls back to a professional
 * monogram placeholder when no photo is available.
 */
export function FacultyPortrait({ name, initials, photo, className }: Props) {
  return (
    <div
      className={cn(
        "aspect-[3/4.5] h-28 w-auto shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted",
        className,
      )}
    >
      {photo ? (
        <img
          src={photo}
          alt={name}
          className="h-full w-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div
          role="img"
          aria-label={`${name} — no photo available`}
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-primary text-primary-foreground"
        >
          <UserRound className="h-8 w-8 text-primary-foreground" strokeWidth={2.25} aria-hidden="true" />
          <span className="font-serif text-lg font-bold tracking-wide text-primary-foreground">{initials}</span>
        </div>
      )}
    </div>
  );
}
