import { Link } from "@tanstack/react-router";
import { Clock, GraduationCap, Monitor, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/data/courses";
import { eligibilityBullets } from "@/data/courses";

export function CourseCard({ course }: { course: Course }) {
  const savings = course.fee - course.discountFee;
  const eligibilityPreview = eligibilityBullets(course.eligibility);
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/70 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {course.category}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">{course.mode}</span>
        </div>
        <CardTitle className="font-serif text-xl leading-tight text-foreground">
          {course.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{course.shortDescription}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pb-3 text-sm">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {course.duration}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Monitor className="h-3.5 w-3.5" /> {course.mode}
          </div>
          <div className="col-span-2 flex items-start gap-1.5 text-muted-foreground">
            <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {eligibilityPreview.length > 0 ? (
              <ul className="line-clamp-2 list-disc space-y-0.5 pl-4">
                {eligibilityPreview.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="line-clamp-2">—</span>
            )}
          </div>
        </div>
        <div className="mt-auto flex items-baseline gap-2 border-t border-border pt-3">
          <span className="font-serif text-2xl font-bold text-primary">
            BDT {course.discountFee.toLocaleString()}
          </span>
          {savings > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              {course.fee.toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 pt-0">
        <Button asChild variant="outline" size="sm">
          <Link to="/courses/$slug" params={{ slug: course.slug }}>
            Details
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/admission" search={{ course: course.slug }}>
            Apply <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
