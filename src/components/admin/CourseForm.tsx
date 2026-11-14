import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Plus, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadCourseCover,
  listCourseFacultyOptionsAdmin,
  type AdminCourseRow,
  type CourseInput,
  type CourseStatus,
  type SyllabusMode,
  type SyllabusSemester,
} from "@/lib/courses.functions";
import { DEFAULT_COURSE_WHATS_INCLUDED, eligibilityBullets, eligibilityToCmsString, normalizeCourseMode } from "@/data/courses";
import { AdminMediaImage } from "@/components/admin/AdminMediaImage";
import { toStoragePath } from "@/lib/assets";

const MODES = ["Online", "Offline", "Online/Offline/Both"] as const;
const CATEGORIES = ["Foundation", "Advanced", "Specialty", "Diploma / Masters"] as const;
const STATUSES: CourseStatus[] = ["draft", "published", "archived"];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeMode(mode: string | null | undefined): string {
  return normalizeCourseMode(mode);
}

function normalizeCategory(category: string | null | undefined): string {
  const raw = (category ?? "").trim();
  if (!raw) return "Foundation";
  const hit = CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  return hit ?? CATEGORIES[0];
}

function normalizeStatus(status: string | null | undefined): CourseStatus {
  const raw = (status ?? "draft").toLowerCase();
  if (raw === "published" || raw === "archived" || raw === "draft") return raw;
  return "draft";
}

export function emptyCourseForm(): CourseInput {
  return {
    slug: "",
    name: "",
    category: "Foundation",
    duration: "",
    mode: "Offline",
    eligibility: "",
    shortDescription: "",
    description: "",
    fee: 0,
    discountFee: 0,
    admissionFee: 0,
    installmentsAvailable: false,
    syllabus: [],
    syllabusMode: "flat",
    syllabusSemesters: [],
    outcomes: [],
    whatsIncluded: [...DEFAULT_COURSE_WHATS_INCLUDED],
    featured: false,
    status: "draft",
    sortOrder: 0,
    imageUrl: "",
    imageUrls: [],
    facultyIds: [],
    seoTitle: "",
    seoDescription: "",
  };
}

export function courseInputFromRow(row: AdminCourseRow): CourseInput {
  return {
    id: row.id,
    slug: row.slug ?? "",
    name: row.name ?? "",
    category: normalizeCategory(row.category),
    duration: row.duration ?? "",
    mode: normalizeMode(row.mode),
    eligibility: row.eligibility ?? "",
    shortDescription: row.shortDescription ?? "",
    description: row.description ?? "",
    fee: Number(row.fee) || 0,
    discountFee: Number(row.discountFee) || 0,
    admissionFee: Number(row.admissionFee) || 0,
    installmentsAvailable: Boolean(row.installmentsAvailable),
    syllabus: Array.isArray(row.syllabus) ? row.syllabus : [],
    syllabusMode: row.syllabusMode === "semester" ? "semester" : "flat",
    syllabusSemesters: Array.isArray(row.syllabusSemesters) ? row.syllabusSemesters : [],
    outcomes: Array.isArray(row.outcomes) ? row.outcomes : [],
    whatsIncluded:
      Array.isArray(row.whatsIncluded) && row.whatsIncluded.length > 0
        ? row.whatsIncluded
        : [...DEFAULT_COURSE_WHATS_INCLUDED],
    featured: Boolean(row.featured),
    status: normalizeStatus(row.status),
    sortOrder: Number(row.sortOrder) || 0,
    imageUrl: row.imageUrl ?? "",
    imageUrls: row.imageUrls?.length ? row.imageUrls : row.imageUrl ? [row.imageUrl] : [],
    facultyIds: row.facultyIds ?? [],
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
  };
}

export function CourseForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
  canPublish,
  isNew,
}: {
  initial?: CourseInput;
  onSubmit: (input: CourseInput) => void;
  submitting: boolean;
  onCancel: () => void;
  canPublish: boolean;
  isNew: boolean;
}) {
  const seed = initial ?? emptyCourseForm();
  const listFacultyFn = useServerFn(listCourseFacultyOptionsAdmin);
  const facultyQuery = useQuery({ queryKey: ["course-faculty-options"], queryFn: () => listFacultyFn() });
  const [form, setForm] = useState<CourseInput>(() => ({
    ...seed,
    mode: normalizeMode(seed.mode),
    category: normalizeCategory(seed.category),
    status: normalizeStatus(seed.status),
  }));
  const [syllabusText, setSyllabusText] = useState<string>(() =>
    (seed.syllabus ?? []).join("\n"),
  );
  const [syllabusMode, setSyllabusMode] = useState<SyllabusMode>(
    () => seed.syllabusMode ?? "flat",
  );
  const [semesters, setSemesters] = useState<
    { label: string; modulesText: string }[]
  >(() => {
    const list = seed.syllabusSemesters ?? [];
    if (list.length === 0) {
      return [{ label: "Semester 1", modulesText: "" }];
    }
    return list.map((s, i) => ({
      label: s.label || `Semester ${i + 1}`,
      modulesText: (s.modules ?? []).join("\n"),
    }));
  });
  const [outcomesText, setOutcomesText] = useState<string>(() =>
    (seed.outcomes ?? []).join("\n"),
  );
  const [whatsIncludedText, setWhatsIncludedText] = useState<string>(() =>
    (seed.whatsIncluded ?? []).join("\n"),
  );
  const [eligibilityText, setEligibilityText] = useState<string>(() =>
    eligibilityToCmsString(seed.eligibility),
  );
  const [slugTouched, setSlugTouched] = useState<boolean>(() => !!seed.slug);

  const set = <K extends keyof CourseInput>(k: K, v: CourseInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleNameChange = (value: string) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    const toLines = (t: string) =>
      t
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    const syllabusSemesters: SyllabusSemester[] =
      syllabusMode === "semester"
        ? semesters.map((s, i) => ({
            label: s.label.trim() || `Semester ${i + 1}`,
            modules: toLines(s.modulesText),
          }))
        : [];
    onSubmit({
      ...form,
      mode: normalizeMode(form.mode),
      category: normalizeCategory(form.category),
      status: normalizeStatus(form.status),
      slug: form.slug.trim().toLowerCase(),
      syllabusMode,
      syllabusSemesters,
      syllabus: syllabusMode === "flat" ? toLines(syllabusText) : [],
      outcomes: toLines(outcomesText),
      whatsIncluded: toLines(whatsIncludedText),
      eligibility: eligibilityToCmsString(eligibilityText),
      fee: Number(form.fee) || 0,
      discountFee: Number(form.discountFee) || 0,
      admissionFee: Number(form.admissionFee) || 0,
      installmentsAvailable: Boolean(form.installmentsAvailable),
      sortOrder: Number(form.sortOrder) || 0,
    });
  };

  const statusValue: CourseStatus = canPublish
    ? normalizeStatus(form.status)
    : isNew
      ? "draft"
      : normalizeStatus(form.status);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course name">
          <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
        </Field>
        <Field label="Slug (URL)">
          <Input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            placeholder="e.g. basic-ultrasound"
            required
          />
        </Field>
        <Field label="Category">
          <Select
            value={normalizeCategory(form.category)}
            onValueChange={(v) => set("category", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Mode">
          <Select value={normalizeMode(form.mode)} onValueChange={(v) => set("mode", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Duration (months)">
          <Input
            value={form.duration}
            onChange={(e) => set("duration", e.target.value)}
            placeholder="e.g. 3 or 3 Months"
          />
          <p className="text-xs text-muted-foreground">
            Enter months (e.g. <strong>3</strong> or <strong>12–18</strong>). The site shows
            “Months” automatically if you leave the unit out.
          </p>
        </Field>
        <Field label="Full fee (BDT)">
          <Input
            type="number"
            value={form.fee}
            onChange={(e) => set("fee", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Discounted fee (BDT)">
          <Input
            type="number"
            value={form.discountFee}
            onChange={(e) => set("discountFee", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Admission fee (BDT)">
          <Input
            type="number"
            value={form.admissionFee}
            onChange={(e) => set("admissionFee", Number(e.target.value) || 0)}
            placeholder="0 = hide on site"
          />
        </Field>
        <div className="flex items-end sm:col-span-2">
          <label className="flex items-center gap-2 pb-2 text-sm">
            <Switch
              checked={form.installmentsAvailable}
              onCheckedChange={(v) => set("installmentsAvailable", v)}
            />
            Multiple installments available
          </label>
        </div>
        <Field label="Sort order">
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Publish status">
          <Select
            value={statusValue}
            onValueChange={(v) => set("status", v as CourseStatus)}
            disabled={!canPublish}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canPublish && (
            <p className="text-xs text-muted-foreground">
              Publishing is Administrator-only. Your course will remain a draft.
            </p>
          )}
        </Field>
      </div>

      <Field label="Course page slider images">
        <p className="text-xs text-muted-foreground">Upload one image for a static course image or several for an automatic slider. The first image is also used on course cards.</p>
        <ImageUploader
          onUploaded={(urls) => setForm((f) => {
            const imageUrls = [...(f.imageUrls ?? []), ...urls];
            return { ...f, imageUrls, imageUrl: imageUrls[0] ?? "" };
          })}
          currentSlug={form.slug}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(form.imageUrls ?? []).map((url, i) => <div key={`${url}-${i}`} className="flex items-center gap-3 rounded-md border p-2">
            <AdminMediaImage src={url} alt={`${form.name || "Course"} image ${i + 1}`} className="h-20 w-28 rounded object-cover" />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">Image {i + 1}</span>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove image ${i + 1}`} onClick={() => setForm((f) => {
              const imageUrls = (f.imageUrls ?? []).filter((_, j) => j !== i);
              return { ...f, imageUrls, imageUrl: imageUrls[0] ?? "" };
            })}><Trash2 className="h-4 w-4" /></Button>
          </div>)}
        </div>
        <Input value={form.imageUrl} onChange={(e) => set("imageUrl", toStoragePath(e.target.value) || e.target.value.trim())} placeholder="Optional cover image URL" className="mt-2" />
      </Field>

      <Field label="Course faculty">
        <p className="text-xs text-muted-foreground">Select one or more faculty members from the Faculty table. Only published faculty appear on the public course page.</p>
        {facultyQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading faculty…</p> : facultyQuery.isError ? <p className="text-sm text-destructive">Could not load faculty options.</p> : facultyQuery.data?.length ? <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
          {facultyQuery.data.map((member) => <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50">
            <Checkbox checked={(form.facultyIds ?? []).includes(member.id)} onCheckedChange={(checked) => setForm((f) => {
              const ids = f.facultyIds ?? [];
              return { ...f, facultyIds: checked ? [...ids, member.id] : ids.filter((id) => id !== member.id) };
            })} />
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{member.name}</span><span className="block text-xs text-muted-foreground">{[member.title, member.credentials, member.specialty].filter(Boolean).join(" · ")}</span></span>
            {!member.isPublished && <span className="text-xs text-muted-foreground">Draft</span>}
          </label>)}
        </div> : <p className="text-sm text-muted-foreground">No faculty records yet. Add faculty from the Faculty section first.</p>}
      </Field>

      <Field label="Short description">
        <Textarea
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          rows={2}
        />
      </Field>
      <Field label="Full description">
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
        />
      </Field>

      <Field label="Eligibility (one requirement per line)">
        <Textarea
          value={eligibilityText}
          onChange={(e) => setEligibilityText(e.target.value)}
          rows={6}
          placeholder={"MBBS / BDS graduates\nFinal-year medical students\nPostgraduate trainees"}
          className="min-h-[9rem]"
        />
        <p className="text-xs text-muted-foreground">
          Each line is one eligibility requirement. The site shows them as bullets — same pattern as
          Syllabus / Module.
        </p>
        {eligibilityBullets(eligibilityText).length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 rounded-md border border-border bg-muted/40 p-3 pl-6 text-xs text-muted-foreground">
            {eligibilityBullets(eligibilityText).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </Field>

      <Field label="Syllabus / Module">
        <div className="space-y-3">
          <Select
            value={syllabusMode}
            onValueChange={(v) => setSyllabusMode(v as SyllabusMode)}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Syllabus type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Modules only (no semesters)</SelectItem>
              <SelectItem value="semester">Semester-based modules</SelectItem>
            </SelectContent>
          </Select>

          {syllabusMode === "flat" ? (
            <>
              <Textarea
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                rows={6}
                placeholder={
                  "Ultrasound physics & instrumentation\nAbdominal sonography\nPelvic & obstetric scanning"
                }
              />
              <p className="text-xs text-muted-foreground">
                Each line is one module. The site shows numbered items under{" "}
                <strong>Syllabus / Module (count)</strong>. Do not type the module
                number — it is added automatically.
              </p>
              {syllabusText
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean).length > 0 ? (
                <ol className="mt-2 space-y-1 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {syllabusText
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={`${i}-${line}`} className="flex items-start gap-2">
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold text-secondary-foreground">
                          {i + 1}
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                </ol>
              ) : null}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Add each semester with its modules (one module per line). The public
                course page shows a semester dropdown, then lists that semester’s
                modules.
              </p>
              {semesters.map((sem, idx) => (
                <div
                  key={idx}
                  className="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[10rem] flex-1 space-y-1.5">
                      <Label className="text-xs">Semester label</Label>
                      <Input
                        value={sem.label}
                        onChange={(e) =>
                          setSemesters((list) =>
                            list.map((s, i) =>
                              i === idx ? { ...s, label: e.target.value } : s,
                            ),
                          )
                        }
                        placeholder={`Semester ${idx + 1}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={semesters.length <= 1}
                      onClick={() =>
                        setSemesters((list) => list.filter((_, i) => i !== idx))
                      }
                      aria-label="Remove semester"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={sem.modulesText}
                    onChange={(e) =>
                      setSemesters((list) =>
                        list.map((s, i) =>
                          i === idx ? { ...s, modulesText: e.target.value } : s,
                        ),
                      )
                    }
                    rows={4}
                    placeholder={"Module one\nModule two\nModule three"}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSemesters((list) => [
                    ...list,
                    { label: `Semester ${list.length + 1}`, modulesText: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Add semester
              </Button>
            </div>
          )}
        </div>
      </Field>
      <Field label="Learning outcomes (one item per line)">
        <Textarea value={outcomesText} onChange={(e) => setOutcomesText(e.target.value)} rows={4} />
      </Field>
      <Field label="What's included in the course (one item per line)">
        <Textarea
          value={whatsIncludedText}
          onChange={(e) => setWhatsIncludedText(e.target.value)}
          rows={5}
          placeholder="Hands-on scanning practice&#10;Certificate of completion&#10;..."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO title">
          <Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
        </Field>
        <Field label="SEO description">
          <Textarea
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            rows={2}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
          Featured on homepage
        </label>
      </div>

      <div className="sticky bottom-0 -mx-6 mt-2 flex justify-end gap-2 border-t bg-background px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save course"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function ImageUploader({
  onUploaded,
  currentSlug,
}: {
  onUploaded: (urls: string[]) => void;
  currentSlug: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFn = useServerFn(uploadCourseCover);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploaded: string[] = [];
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: please choose an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: image must be under 5MB`);
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
        const base64 = btoa(binary);
        const { url } = await uploadFn({
          data: {
            fileName: file.name,
            contentType: file.type,
            base64,
            currentSlug,
          },
        });
        uploaded.push(url);
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`);
      }
    }
    if (uploaded.length) {
      onUploaded(uploaded);
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload from device"}
      </Button>
      <span className="text-xs text-muted-foreground">PNG/JPG, up to 5MB</span>
    </div>
  );
}
