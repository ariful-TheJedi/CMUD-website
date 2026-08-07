import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadCourseCover,
  type AdminCourseRow,
  type CourseInput,
  type CourseStatus,
} from "@/lib/courses.functions";

const MODES = ["Online", "Onsite", "Hybrid", "Hybrid, Onsite"] as const;
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
  const raw = (mode ?? "").trim();
  if (!raw) return "Onsite";
  const hit = MODES.find((m) => m.toLowerCase() === raw.toLowerCase());
  return hit ?? "Onsite";
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
    mode: "Onsite",
    eligibility: "",
    shortDescription: "",
    description: "",
    fee: 0,
    discountFee: 0,
    syllabus: [],
    outcomes: [],
    featured: false,
    status: "draft",
    sortOrder: 0,
    imageUrl: "",
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
    syllabus: Array.isArray(row.syllabus) ? row.syllabus : [],
    outcomes: Array.isArray(row.outcomes) ? row.outcomes : [],
    featured: Boolean(row.featured),
    status: normalizeStatus(row.status),
    sortOrder: Number(row.sortOrder) || 0,
    imageUrl: row.imageUrl ?? "",
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
  const [form, setForm] = useState<CourseInput>(() => ({
    ...seed,
    mode: normalizeMode(seed.mode),
    category: normalizeCategory(seed.category),
    status: normalizeStatus(seed.status),
  }));
  const [syllabusText, setSyllabusText] = useState<string>(() =>
    (seed.syllabus ?? []).join("\n"),
  );
  const [outcomesText, setOutcomesText] = useState<string>(() =>
    (seed.outcomes ?? []).join("\n"),
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
    onSubmit({
      ...form,
      mode: normalizeMode(form.mode),
      category: normalizeCategory(form.category),
      status: normalizeStatus(form.status),
      slug: form.slug.trim().toLowerCase(),
      syllabus: toLines(syllabusText),
      outcomes: toLines(outcomesText),
      fee: Number(form.fee) || 0,
      discountFee: Number(form.discountFee) || 0,
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
        <Field label="Duration">
          <Input
            value={form.duration}
            onChange={(e) => set("duration", e.target.value)}
            placeholder="e.g. 3 Months"
          />
        </Field>
        <Field label="Eligibility">
          <Input value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
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

      <Field label="Cover image">
        <Input
          value={form.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
          placeholder="Paste image URL or upload below"
        />
        <ImageUploader
          onUploaded={(url) => set("imageUrl", url)}
          currentSlug={form.slug}
          previousUrl={form.imageUrl}
        />
        {form.imageUrl ? (
          <img
            src={form.imageUrl}
            alt="Course cover preview"
            className="mt-2 h-32 w-auto rounded-md border border-border object-cover"
          />
        ) : null}
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

      <Field label="Syllabus (one item per line)">
        <Textarea value={syllabusText} onChange={(e) => setSyllabusText(e.target.value)} rows={5} />
      </Field>
      <Field label="Learning outcomes (one item per line)">
        <Textarea value={outcomesText} onChange={(e) => setOutcomesText(e.target.value)} rows={4} />
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
  previousUrl,
}: {
  onUploaded: (url: string) => void;
  currentSlug: string;
  previousUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFn = useServerFn(uploadCourseCover);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
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
          previousUrl,
        },
      });
      onUploaded(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
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
