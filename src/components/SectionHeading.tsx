import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-muted-foreground md:text-lg">{description}</p>
      )}
    </div>
  );
}
