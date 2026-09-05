import { createFileRoute, useLocation } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { admissionPage } from "@/data/admission";
import { listPublicCourses } from "@/lib/courses.functions";
import { submitAdmissionApplication } from "@/lib/admissions.functions";
import { Turnstile } from "@/components/Turnstile";
import { TURNSTILE_BYPASS_TOKEN, isTurnstileEnabledClient } from "@/lib/turnstile";

// --- 1. ROUTE & QUERIES ---

export const coursesQueryOptions = queryOptions({
  queryKey: ["public-courses"],
  queryFn: () => listPublicCourses(),
});

export type ApplyFormData = typeof admissionPage.forms.apply;
export type RegistrationFormData = typeof admissionPage.forms.registration;

const admissionSearchSchema = z.object({
  course: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/admission")({
  validateSearch: (search) => admissionSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: admissionPage.meta.title },
      { name: "description", content: admissionPage.meta.description },
      { property: "og:title", content: admissionPage.meta.ogTitle },
      { property: "og:description", content: admissionPage.meta.ogDescription },
    ],
  }),
  component: AdmissionPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQueryOptions),
});

// --- 2. SCHEMAS ---

const baseSchemaFields = {
  fullName: z.string().min(2, "Enter your full name"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
  phone: z.string().min(7, "Enter a valid phone number"),
  qualification: z.string().min(2, "Required"),
  medicalCollege: z.string().optional().or(z.literal("")),
  bmdcNumber: z.string().min(2, "Enter BMDC number"),
  preferredBranch: z.string().min(1, "Select a preferred branch"),
  course: z.string().min(1, "Select a course"),
  batch: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  howDidYouFindUs: z.string().optional().or(z.literal("")),
  message: z.string().optional(),
};

const requestSchema = z.object({
  ...baseSchemaFields,
  qualification: z.string().optional().or(z.literal("")),
  bmdcNumber: z.string().optional().or(z.literal("")),
});

const paymentSchema = z.object({
  ...baseSchemaFields,
  qualification: z.string().optional().or(z.literal("")),
  bmdcNumber: z.string().optional().or(z.literal("")),
  findUsOptions: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().min(1, "Select a payment method"),
  mobileNumber: z.string().optional().or(z.literal("")),
  transactionId: z.string().optional().or(z.literal("")),
  cashSerialNumber: z.string().optional().or(z.literal("")),
}).superRefine((values, context) => {
  if (values.paymentMethod === "bKash") {
    if (!values.mobileNumber?.trim()) {
      context.addIssue({ code: "custom", path: ["mobileNumber"], message: "Enter bKash mobile number" });
    }
    if (!values.transactionId?.trim()) {
      context.addIssue({ code: "custom", path: ["transactionId"], message: "Enter bKash transaction ID" });
    }
  }
  if (values.paymentMethod === "cash" && !values.cashSerialNumber?.trim()) {
    context.addIssue({ code: "custom", path: ["cashSerialNumber"], message: "Enter cash S/N number" });
  }
});

type RequestFormValues = z.infer<typeof requestSchema>;
type PaymentFormValues = z.infer<typeof paymentSchema>;
const RequiredMark = () => <span className="text-destructive">*</span>;

// --- 3. PARENT LAYOUT (The Switcher) ---

export function AdmissionPage() {
  const { course } = Route.useSearch();
  const { data: courses } = useSuspenseQuery(coursesQueryOptions);
  const { hero } = admissionPage;
  const currentPath = useLocation().pathname;
  
  const isRegistration = currentPath === "/admission/registration";

  return (
    <>
      <section className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-10 text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {hero.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            {hero.description}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <AdmissionFormTabs activeTab={isRegistration ? "registration" : "apply"} course={course} />
          <div className="p-6 md:p-10">
            {isRegistration ? (
              <RegistrationAdmissionForm formData={admissionPage.forms.registration} initialCourse={course} courses={courses} />
            ) : (
              <ApplyAdmissionForm formData={admissionPage.forms.apply} initialCourse={course} courses={courses} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export function AdmissionFormTabs({
  activeTab,
  course,
}: {
  activeTab: "apply" | "registration";
  course?: string;
}) {
  const { forms } = admissionPage;
  const currentPath = useLocation().pathname;
  const currentTab = currentPath === "/admission/registration" ? "registration" : activeTab;

  return (
    <div className="flex flex-col sm:flex-row w-full border-b border-border bg-muted/30">
      <a
        href={course ? `/admission/apply?course=${encodeURIComponent(course)}` : "/admission/apply"}
        aria-current={currentTab === "apply" ? "page" : undefined}
        className={`flex-1 px-4 py-4 text-center text-sm font-semibold transition-colors duration-200 sm:text-base ${
          currentTab === "apply"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        }`}
      >
        {forms.apply.tabLabel}
      </a>
      <a
        href={course ? `/admission/registration?course=${encodeURIComponent(course)}` : "/admission/registration"}
        aria-current={currentTab === "registration" ? "page" : undefined}
        className={`flex-1 border-t sm:border-t-0 sm:border-l border-border/50 px-4 py-4 text-center text-sm font-semibold transition-colors duration-200 sm:text-base ${
          currentTab === "registration"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        }`}
      >
        {forms.registration.tabLabel}
      </a>
    </div>
  );
}

// --- 4. SHARED UI COMPONENT ---

export function SharedAdmissionFields({
  control,
  formCopy,
  courses,
}: {
  control: any;
  formCopy: any;
  courses: any[];
}) {
  const { branches, batches, findUsOptions } = formCopy;
  // Use global labels and placeholders to prevent undefined crashes
  const { labels, placeholders } = admissionPage;

  return (
    <>
      <FormField control={control} name="fullName" render={({ field }) => (
        <FormItem><FormLabel>{labels.fullName} <RequiredMark /></FormLabel><FormControl><Input placeholder={placeholders.fullName} {...field} /></FormControl><FormMessage /></FormItem>
      )}/>
      <FormField control={control} name="email" render={({ field }) => (
        <FormItem><FormLabel>{labels.email}</FormLabel><FormControl><Input type="email" placeholder={placeholders.email} {...field} /></FormControl><FormMessage /></FormItem>
      )}/>
      <FormField control={control} name="phone" render={({ field }) => (
        <FormItem><FormLabel>{labels.phone} <RequiredMark /></FormLabel><FormControl><Input placeholder={placeholders.phone} {...field} /></FormControl><FormMessage /></FormItem>
      )}/>
      <FormField control={control} name="qualification" render={({ field }) => (
        <FormItem><FormLabel>{labels.qualification} <RequiredMark /></FormLabel><FormControl><Input placeholder={placeholders.qualification} {...field} /></FormControl><FormMessage /></FormItem>
      )}/>
      <FormField control={control} name="medicalCollege" render={({ field }) => (
        <FormItem><FormLabel>{labels.medicalCollege}</FormLabel><FormControl><Input placeholder={placeholders.medicalCollege} {...field} /></FormControl><FormMessage /></FormItem>
      )}/>
      <FormField control={control} name="bmdcNumber" render={({ field }) => (
        <FormItem><FormLabel>{labels.bmdcNumber} <RequiredMark /></FormLabel><FormControl><Input placeholder={placeholders.bmdcNumber} {...field} /></FormControl><FormMessage /></FormItem>
      )}/>
      <FormField control={control} name="preferredBranch" render={({ field }) => (
        <FormItem>
          <FormLabel>{labels.preferredBranch} <RequiredMark /></FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder={placeholders.preferredBranch} /></SelectTrigger></FormControl>
            <SelectContent>{branches.map((b: any) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}</SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}/>
      <FormField control={control} name="course" render={({ field }) => (
        <FormItem>
          <FormLabel>{labels.course} <RequiredMark /></FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder={placeholders.course} /></SelectTrigger></FormControl>
            <SelectContent>{courses.map((c: any) => (<SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>))}</SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}/>
      <FormField control={control} name="batch" render={({ field }) => (
        <FormItem>
          <FormLabel>{labels.preferredBatch}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || undefined}>
            <FormControl><SelectTrigger><SelectValue placeholder={placeholders.preferredBatch} /></SelectTrigger></FormControl>
            <SelectContent>{batches.map((b: any) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}</SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}/>
      
      {/* Conditionally render findUsOptions if it exists in the active form's data */}
      {findUsOptions && (
        <FormField control={control} name="findUsOptions" render={({ field }) => (
          <FormItem>
            <FormLabel>{labels.howDidYouFindUs}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || undefined}>
              <FormControl><SelectTrigger><SelectValue placeholder={placeholders.howDidYouFindUs} /></SelectTrigger></FormControl>
              <SelectContent>{findUsOptions.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}/>
      )}
    </>
  );
}

// --- 5. FORM A: REQUEST FOR ADMISSION ---

export function ApplyAdmissionForm({ formData, initialCourse, courses }: { formData: ApplyFormData; initialCourse?: string; courses: any[]; }) {
  const submit = useServerFn(submitAdmissionApplication);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(() => isTurnstileEnabledClient() ? "" : TURNSTILE_BYPASS_TOKEN);
  const { labels, placeholders } = admissionPage;

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", qualification: "", medicalCollege: "",
      bmdcNumber: "", preferredBranch: "", course: initialCourse ?? "",
      batch: "", address: "", howDidYouFindUs: "", message: "",
    },
  });

async function onSubmit(values: RequestFormValues) {
    if (submitting) return;
    if (!captchaToken) return toast.error(admissionPage.errors.captcha);
    setSubmitting(true);
    try {
      await submit({
        data: {
          fullName: values.fullName, 
          email: values.email, 
          phone: values.phone,
          qualification: values.qualification || "Not provided", 
          medicalCollege: values.medicalCollege,
          bmdcNumber: values.bmdcNumber || "Not provided", 
          preferredBranch: values.preferredBranch as any,
          courseSlug: values.course, 
          preferredBatch: values.batch, 
          address: values.address,
          howDidYouFindUs: values.howDidYouFindUs, 
          applicantMessage: values.message ?? "",
          website: "", 
          captchaToken,
          
          // STRICTLY ROUTE TO GENERAL TABLE
          admissionType: "request",
        },
      });
      setSubmitted(true);
      toast.success(admissionPage.success.toastTitle, { description: admissionPage.success.toastDescription });
      form.reset();
      setCaptchaToken(isTurnstileEnabledClient() ? "" : TURNSTILE_BYPASS_TOKEN);
      if (isTurnstileEnabledClient()) window.turnstile?.reset();
    } catch (err) {
      toast.error(admissionPage.errors.submitTitle, { description: err instanceof Error ? err.message : admissionPage.errors.submitDescription });
    } finally {
      setSubmitting(false);
    }
  }
  const { submit: submitCopy, success } = admissionPage;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2 animate-in fade-in duration-500">
        
        {/* Inject Shared Fields */}
        <SharedAdmissionFields control={form.control} formCopy={formData} courses={courses} />

        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem className="md:col-span-2"><FormLabel>{labels.address}</FormLabel><FormControl><Input placeholder={placeholders.address} {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem className="md:col-span-2"><FormLabel>{labels.message}</FormLabel><FormControl><Textarea placeholder={placeholders.message} rows={4} {...field} /></FormControl><FormMessage /></FormItem>
        )}/>

        <div className="md:col-span-2 space-y-3 pt-4 mt-2">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" onChange={() => {}} />
          <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
          {submitted && <div className="rounded-md border border-secondary/40 bg-secondary/10 p-4 text-sm text-foreground">{success.banner}</div>}
          <Button type="submit" size="lg" className="w-full md:w-auto" disabled={submitting || !captchaToken}>
            {submitting ? submitCopy.submitting : formData.submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// --- 6. FORM B: NEW STUDENT ADMISSION (ON PAYMENT) ---

export function RegistrationAdmissionForm({ formData, initialCourse, courses }: { formData: RegistrationFormData; initialCourse?: string; courses: any[]; }) {
  const submit = useServerFn(submitAdmissionApplication);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(() => isTurnstileEnabledClient() ? "" : TURNSTILE_BYPASS_TOKEN);
  const { labels, placeholders } = admissionPage;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", qualification: "", medicalCollege: "",
      bmdcNumber: "", preferredBranch: "", course: initialCourse ?? "",
      batch: "", findUsOptions: "", paymentMethod: "", mobileNumber: "", transactionId: "", cashSerialNumber: "",
      address: "", howDidYouFindUs: "", message: "",
    },
  });

async function onSubmit(values: PaymentFormValues) {
    if (submitting) return;
    if (!captchaToken) return toast.error(admissionPage.errors.captcha);
    setSubmitting(true);
    try {
      await submit({
        data: {
          fullName: values.fullName, 
          email: values.email, 
          phone: values.phone,
          qualification: values.qualification || "Not provided", 
          medicalCollege: values.medicalCollege,
          bmdcNumber: values.bmdcNumber || "Not provided", 
          preferredBranch: values.preferredBranch as any,
          courseSlug: values.course, 
          preferredBatch: values.batch, 
          address: values.address,
          howDidYouFindUs: values.findUsOptions, 
          applicantMessage: values.message ?? "",
          website: "", 
          captchaToken,

          // STRICTLY ROUTE TO PAYMENT TABLE
          admissionType: "payment",
          paymentMethod: values.paymentMethod,
          mobileNumber: values.mobileNumber,
          transactionId: values.transactionId,
          cashSerialNumber: values.cashSerialNumber,
        },
      });
      setSubmitted(true);
      toast.success(admissionPage.success.toastTitle, { description: admissionPage.success.toastDescription });
      form.reset();
      setCaptchaToken(isTurnstileEnabledClient() ? "" : TURNSTILE_BYPASS_TOKEN);
      if (isTurnstileEnabledClient()) window.turnstile?.reset();
    } catch (err) {
      toast.error(admissionPage.errors.submitTitle, { description: err instanceof Error ? err.message : admissionPage.errors.submitDescription });
    } finally {
      setSubmitting(false);
    }
  }

  const { fields } = formData;
  const paymentMethodSelectOptions = formData.paymentMethodOptions;
  const { submit: submitCopy, success } = admissionPage;
  const selectedPaymentMethod = form.watch("paymentMethod");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2 animate-in fade-in duration-500">
        
        {/* Inject Shared Fields */}
        <SharedAdmissionFields control={form.control} formCopy={formData} courses={courses} />

        <div className="md:col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-5">
          <h3 className="font-semibold text-foreground">{formData.paymentSection.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{formData.paymentSection.description}</p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <FormField control={form.control} name="paymentMethod" render={({ field }) => (
              <FormItem>
                <FormLabel>{fields.paymentMethod.label} <RequiredMark /></FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder={fields.paymentMethod.placeholder} /></SelectTrigger></FormControl>
                  <SelectContent>{paymentMethodSelectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            {selectedPaymentMethod === "bKash" && (
              <>
                <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fields.mobileNumber.label} <RequiredMark /></FormLabel>
                    <FormControl><Input type="tel" placeholder={fields.mobileNumber.placeholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="transactionId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fields.transactionId.label} <RequiredMark /></FormLabel>
                    <FormControl><Input placeholder={fields.transactionId.placeholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </>
            )}
            {selectedPaymentMethod === "cash" && (
              <FormField control={form.control} name="cashSerialNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{fields.cashSerialNumber.label} <RequiredMark /></FormLabel>
                  <FormControl><Input placeholder={fields.cashSerialNumber.placeholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            )}
          </div>
        </div>

        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem className="md:col-span-2"><FormLabel>{labels.address}</FormLabel><FormControl><Input placeholder={placeholders.address} {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem className="md:col-span-2"><FormLabel>{labels.message}</FormLabel><FormControl><Textarea placeholder={placeholders.message} rows={4} {...field} /></FormControl><FormMessage /></FormItem>
        )}/>

        <div className="md:col-span-2 space-y-3 pt-4  mt-2">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" onChange={() => {}} />
          <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
          {submitted && <div className="rounded-md border border-secondary/40 bg-secondary/10 p-4 text-sm text-foreground">{success.banner}</div>}
          <Button type="submit" size="lg" className="w-full md:w-auto" disabled={submitting || !captchaToken}>
            {submitting ? submitCopy.submitting : formData.submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}