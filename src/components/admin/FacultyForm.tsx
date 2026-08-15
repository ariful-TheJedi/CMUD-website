import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadFacultyPhoto,
  type AdminFacultyRow,
  type FacultyInput,
  type FacultyStatus,
} from "@/lib/faculty.functions";
import { AdminMediaImage, useObjectUrl } from "@/components/admin/AdminMediaImage";

const STATUSES: FacultyStatus[] = ["draft", "published", "archived"];

function initialsFrom(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => !/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)$/i.test(p));
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function normalizeStatus(status: string | null | undefined): FacultyStatus {
  const raw = (status ?? "draft").toLowerCase();
  if (raw === "published" || raw === "archived" || raw === "draft") return raw;
  return "draft";
}

export function emptyFacultyForm(): FacultyInput {
  return {
    name: "",
    title: "",
    credentials: "",
    specialty: "",
    phone: "",
    shortBio: "",
    fullBio: "",
    initials: "",
    photoUrl: "",
    altText: "",
    status: "draft",
    sortOrder: 0,
  };
}

export function facultyInputFromRow(row: AdminFacultyRow): FacultyInput {
  return {
    id: row.id,
    name: row.name ?? "",
    title: row.title ?? "",
    credentials: row.credentials ?? "",
    specialty: row.specialty ?? "",
    phone: row.phone ?? "",
    shortBio: row.shortBio ?? "",
    fullBio: row.fullBio ?? "",
    initials: row.initials ?? "",
    photoUrl: row.photoUrl ?? "",
    altText: row.altText ?? "",
    status: normalizeStatus(row.status),
    sortOrder: Number(row.sortOrder) || 0,
  };
}

export function FacultyForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
  canPublish = true,
  isNew = false,
  readOnly = false,
}: {
  initial?: FacultyInput;
  onSubmit: (input: FacultyInput) => void;
  submitting: boolean;
  onCancel: () => void;
  canPublish?: boolean;
  isNew?: boolean;
  readOnly?: boolean;
}) {
  const seed = initial ?? emptyFacultyForm();
  const [form, setForm] = useState<FacultyInput>(() => ({
    ...seed,
    status: normalizeStatus(seed.status),
    sortOrder: Number(seed.sortOrder) || 0,
  }));
  const [pickedPhoto, setPickedPhoto] = useState<File | null>(null);
  const photoPreview = useObjectUrl(pickedPhoto);

  const set = <K extends keyof FacultyInput>(k: K, v: FacultyInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const payload: FacultyInput = {
      ...form,
      name: form.name.trim(),
      status: normalizeStatus(form.status),
      sortOrder: Number(form.sortOrder) || 0,
      initials: form.initials.trim() || initialsFrom(form.name),
    };
    if (!canPublish && isNew) payload.status = "draft";
    onSubmit(payload);
  };

  const statusValue: FacultyStatus = canPublish
    ? normalizeStatus(form.status)
    : isNew
      ? "draft"
      : normalizeStatus(form.status);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            disabled={readOnly}
            readOnly={readOnly}
          />
        </Field>
        <Field label="Designation / title">
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
          />
        </Field>
        <Field label="Specialty / category">
          <Input
            value={form.specialty}
            onChange={(e) => set("specialty", e.target.value)}
            placeholder="e.g. OBS Gynae, MSK, Vascular"
            disabled={readOnly}
            readOnly={readOnly}
          />
        </Field>
        <Field label="Phone number (admin only)">
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="e.g. +880 1XXX-XXXXXX"
            disabled={readOnly}
            readOnly={readOnly}
          />
          <p className="text-xs text-muted-foreground">
            Visible to admin users only — never shown on the public website.
          </p>
        </Field>
        <Field label="Initials (fallback avatar)">
          <Input
            value={form.initials}
            onChange={(e) => set("initials", e.target.value.toUpperCase().slice(0, 3))}
            placeholder="Auto from name if empty"
            disabled={readOnly}
            readOnly={readOnly}
          />
        </Field>
        <Field label="Display order">
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
            disabled={readOnly}
            readOnly={readOnly}
          />
        </Field>
        <Field label="Publish status">
          <Select
            value={statusValue}
            onValueChange={(v) => set("status", v as FacultyStatus)}
            disabled={readOnly || !canPublish}
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
          {!readOnly && !canPublish && (
            <p className="text-xs text-muted-foreground">
              Publishing is Administrator-only. New profiles stay as draft.
            </p>
          )}
        </Field>
      </div>

      <Field label="Credentials">
        <Textarea
          value={form.credentials}
          onChange={(e) => set("credentials", e.target.value)}
          rows={2}
          disabled={readOnly}
          readOnly={readOnly}
        />
      </Field>

      <Field label="Short bio (card / listings)">
        <Textarea
          value={form.shortBio}
          onChange={(e) => set("shortBio", e.target.value)}
          rows={2}
          disabled={readOnly}
          readOnly={readOnly}
        />
      </Field>

      <Field label="Full bio (faculty page)">
        <Textarea
          value={form.fullBio}
          onChange={(e) => set("fullBio", e.target.value)}
          rows={5}
          disabled={readOnly}
          readOnly={readOnly}
        />
      </Field>

      <Field label="Photo">
        {!readOnly && (
          <Input
            value={form.photoUrl}
            onChange={(e) => {
              setPickedPhoto(null);
              set("photoUrl", e.target.value);
            }}
            placeholder="Paste image URL or upload below"
          />
        )}
        {!readOnly && (
          <PhotoUploader
            onUploaded={(url) => set("photoUrl", url)}
            onPickedFile={setPickedPhoto}
            currentName={form.name}
            previousUrl={form.photoUrl}
          />
        )}
        {form.photoUrl || photoPreview ? (
          <AdminMediaImage
            src={form.photoUrl}
            localPreviewSrc={photoPreview}
            alt={form.altText || "Faculty photo preview"}
            className="mt-2 h-32 w-auto rounded-md border border-border object-cover object-top"
          />
        ) : readOnly ? (
          <p className="text-sm text-muted-foreground">No photo</p>
        ) : null}
      </Field>

      <Field label="Image alt text (accessibility)">
        <Input
          value={form.altText}
          onChange={(e) => set("altText", e.target.value)}
          placeholder="e.g. Portrait of Dr. Jane Doe"
          disabled={readOnly}
          readOnly={readOnly}
        />
      </Field>

      <div className="sticky bottom-0 -mx-6 mt-2 flex justify-end gap-2 border-t bg-background px-6 py-4">
        {readOnly ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save faculty"}
            </Button>
          </>
        )}
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

function PhotoUploader({
  onUploaded,
  onPickedFile,
  currentName,
  previousUrl,
}: {
  onUploaded: (url: string) => void;
  onPickedFile?: (file: File | null) => void;
  currentName: string;
  previousUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFn = useServerFn(uploadFacultyPhoto);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    onPickedFile?.(file);
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
          currentName,
          previousUrl,
        },
      });
      onUploaded(url);
      toast.success("Image uploaded");
    } catch (e) {
      onPickedFile?.(null);
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
