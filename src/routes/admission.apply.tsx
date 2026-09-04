import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AdmissionPage, coursesQueryOptions } from "@/routes/admission";

const admissionSearchSchema = z.object({
  course: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/admission/apply")({
  validateSearch: (search) => admissionSearchSchema.parse(search),
  component: AdmissionPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQueryOptions),
});
