import { useRef, useState } from "react";
import { useCanWrite } from "@/hooks/use-can-write";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Pencil, Plus, Trash2, Upload, X, GripVertical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetUrl, toStoragePath } from "@/lib/assets";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  type AdminNotice,
  type NoticeAttachment,
  type NoticeCategory,
  type NoticeInput,
  createCategoryAdmin,
  deleteCategoryAdmin,
  deleteNoticeAdmin,
  listAllNoticesAdmin,
  listCategoriesAdmin,
  toggleNoticePublishedAdmin,
  uploadNoticeAttachment,
  upsertNoticeAdmin,
} from "@/lib/notices.functions";

export const Route = createFileRoute("/_authenticated/admin/notices")({
  head: () => ({
    meta: [{ title: "Notices — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: NoticesAdminPage,
});

function NoticesAdminPage() {
  const canWrite = useCanWrite("notices");
  const qc = useQueryClient();
  const listFn = useServerFn(listAllNoticesAdmin);
  const catsFn = useServerFn(listCategoriesAdmin);
  const upsertFn = useServerFn(upsertNoticeAdmin);
  const toggleFn = useServerFn(toggleNoticePublishedAdmin);
  const deleteFn = useServerFn(deleteNoticeAdmin);
  const createCatFn = useServerFn(createCategoryAdmin);
  const deleteCatFn = useServerFn(deleteCategoryAdmin);

  const notices = useQuery({ queryKey: ["admin-notices"], queryFn: () => listFn() });
  const cats = useQuery({ queryKey: ["admin-notice-categories"], queryFn: () => catsFn() });

  const [editing, setEditing] = useState<AdminNotice | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminNotice | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-notices"] });
    qc.invalidateQueries({ queryKey: ["public-notices"] });
  };
  const invalidateCats = () => {
    qc.invalidateQueries({ queryKey: ["admin-notice-categories"] });
    qc.invalidateQueries({ queryKey: ["public-notice-categories"] });
  };

  const upsert = useMutation({
    mutationFn: (input: NoticeInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Notice saved");
      invalidate();
      setEditing(null);
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; isPublished: boolean }) => toggleFn({ data: v }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Notice deleted");
      invalidate();
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createCat = useMutation({
    mutationFn: (name: string) => createCatFn({ data: { name } }),
    onSuccess: () => {
      toast.success("Category created");
      invalidateCats();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCat = useMutation({
    mutationFn: (id: string) => deleteCatFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Category deleted");
      invalidateCats();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = notices.data ?? [];
  const categories = cats.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notices</h1>
          <p className="text-sm text-muted-foreground">
            Manage notice board entries and their categories.
          </p>
        </div>
        <div className="flex gap-2">
          {canWrite && (
            <Button variant="outline" onClick={() => setManagingCategories(true)}>
              Manage categories
            </Button>
          )}
          {canWrite && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New notice
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {notices.isLoading ? "Loading…" : `${rows.length} notices`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 && !notices.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No notices yet. Click "New notice" to add one.
            </div>
          ) : (
            <div className="max-h-[calc(100vh-16rem)] overflow-auto rounded-md border">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((n) => (
                    <tr key={n.id} className="border-t align-top">
                      <td className="px-3 py-2 whitespace-nowrap">{n.noticeDate}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{n.title}</div>
                        {n.body ? (
                          <div className="mt-0.5 line-clamp-2 max-w-[420px] text-xs text-muted-foreground">
                            {n.body}
                          </div>
                        ) : null}
                        {n.attachments.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {n.attachments.map((a) => (
                              <a
                                key={a.id ?? a.fileUrl}
                                href={assetUrl(a.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-primary hover:underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {a.displayName?.trim() || a.fileName}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        {n.category?.name ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{n.sortOrder}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggle.mutate({ id: n.id, isPublished: !n.isPublished })}
                          disabled={toggle.isPending}
                          aria-pressed={n.isPublished}
                          className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                          style={
                            n.isPublished
                              ? {
                                  background: "hsl(var(--primary))",
                                  color: "hsl(var(--primary-foreground))",
                                }
                              : {
                                  background: "hsl(var(--destructive))",
                                  color: "hsl(var(--destructive-foreground))",
                                }
                          }
                        >
                          {n.isPublished ? "Published" : "Unpublished"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditing(n)}
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setToDelete(n)}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <NoticeFormDialog
        open={creating || editing !== null}
        initial={editing ?? undefined}
        categories={categories}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
        onSubmit={(input) => upsert.mutate(input)}
        submitting={upsert.isPending}
      />

      <CategoriesDialog
        open={managingCategories}
        onOpenChange={setManagingCategories}
        categories={categories}
        onCreate={(name) => createCat.mutate(name)}
        onDelete={(id) => removeCat.mutate(id)}
        creating={createCat.isPending}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this notice?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && remove.mutate(toDelete.id)}
              disabled={remove.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NoticeFormDialog({
  open,
  initial,
  categories,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  initial?: AdminNotice;
  categories: NoticeCategory[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NoticeInput) => void;
  submitting: boolean;
}) {
  const key = initial?.id ?? "new";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        onPointerDownOutside={(e) => {
          const el = e.target as HTMLElement | null;
          if (el?.closest?.("[data-radix-select-content],[data-radix-popper-content-wrapper]")) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const el = e.target as HTMLElement | null;
          if (el?.closest?.("[data-radix-select-content],[data-radix-popper-content-wrapper]")) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{initial ? "Edit notice" : "New notice"}</DialogTitle>
        </DialogHeader>
        <NoticeForm
          key={key}
          initial={initial}
          categories={categories}
          onSubmit={onSubmit}
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function NoticeForm({
  initial,
  categories,
  onSubmit,
  submitting,
  onCancel,
}: {
  initial?: AdminNotice;
  categories: NoticeCategory[];
  onSubmit: (input: NoticeInput) => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<NoticeInput>(() =>
    initial
      ? {
          id: initial.id,
          title: initial.title,
          body: initial.body,
          noticeDate: initial.noticeDate,
          categoryId: initial.category?.id ?? null,
          isPublished: initial.isPublished,
          sortOrder: initial.sortOrder,
          attachments: initial.attachments.map((a) => ({ ...a })),
        }
      : {
          title: "",
          body: "",
          noticeDate: new Date().toISOString().slice(0, 10),
          categoryId: categories[0]?.id ?? null,
          isPublished: true,
          sortOrder: 0,
          attachments: [],
        },
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFn = useServerFn(uploadNoticeAttachment);

  const fileToBase64 = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const uploaded: NoticeAttachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20MB — skipped`);
          continue;
        }
        const { url, fileName } = await uploadFn({
          data: {
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            base64: await fileToBase64(file),
          },
        });
        uploaded.push({
          fileUrl: toStoragePath(url) || url,
          fileName,
          displayName: fileName.replace(/\.[^.]+$/, "") || fileName,
          sortOrder: 0,
        });
      }
      if (uploaded.length) {
        setForm((f) => ({
          ...f,
          attachments: [...f.attachments, ...uploaded].map((a, i) => ({ ...a, sortOrder: i })),
        }));
        toast.success(`${uploaded.length} file(s) uploaded`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateAttachment = (idx: number, patch: Partial<NoticeAttachment>) => {
    setForm((f) => ({
      ...f,
      attachments: f.attachments.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    }));
  };
  const removeAttachment = (idx: number) => {
    setForm((f) => ({
      ...f,
      attachments: f.attachments
        .filter((_, i) => i !== idx)
        .map((a, i) => ({ ...a, sortOrder: i })),
    }));
  };
  const moveAttachment = (idx: number, dir: -1 | 1) => {
    setForm((f) => {
      const arr = [...f.attachments];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return f;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...f, attachments: arr.map((a, i) => ({ ...a, sortOrder: i })) };
    });
  };

  const set = <K extends keyof NoticeInput>(k: K, v: NoticeInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Body</Label>
        <Textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={4} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input
            type="date"
            value={form.noticeDate}
            onChange={(e) => set("noticeDate", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={form.categoryId ?? "__none__"}
            onValueChange={(v) => set("categoryId", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attachments (PDF, Word, image, etc.)</Label>
        <p className="text-xs text-muted-foreground">
          Set a custom display name for each file — that name is what visitors see on the site.
        </p>
        {form.attachments.length > 0 ? (
          <ul className="space-y-3">
            {form.attachments.map((a, idx) => (
              <li
                key={a.id ?? `${a.fileUrl}-${idx}`}
                className="rounded-md border border-border bg-muted/40 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveAttachment(idx, -1)}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <a
                    href={assetUrl(a.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 flex-1 items-center gap-2 truncate text-sm text-primary hover:underline"
                    title={a.fileName}
                  >
                    <Paperclip className="h-4 w-4 shrink-0" />
                    <span className="truncate">{a.fileName}</span>
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(idx)}
                    aria-label="Remove attachment"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Display name (shown on site)</Label>
                  <Input
                    placeholder={a.fileName || "e.g. Admission Circular 2026"}
                    value={a.displayName ?? ""}
                    onChange={(e) => updateAttachment(idx, { displayName: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Preview:{" "}
                    <span className="font-medium text-foreground">
                      {(a.displayName ?? "").trim() || a.fileName || "Untitled file"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => moveAttachment(idx, -1)}
                    disabled={idx === 0}
                    className="rounded border px-2 py-0.5 disabled:opacity-40"
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAttachment(idx, 1)}
                    disabled={idx === form.attachments.length - 1}
                    className="rounded border px-2 py-0.5 disabled:opacity-40"
                  >
                    ↓ Down
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          <span>{uploading ? "Uploading…" : "Add attachment(s)"}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length) void handleFiles(e.target.files);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Sort order (lower shows first when dates tie)</Label>
        <Input
          type="number"
          value={form.sortOrder}
          onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch checked={form.isPublished} onCheckedChange={(v) => set("isPublished", v)} />
        Published (visible on site)
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? "Saving…" : "Save notice"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CategoriesDialog({
  open,
  onOpenChange,
  categories,
  onCreate,
  onDelete,
  creating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: NoticeCategory[];
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  creating: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onCreate(name.trim());
            setName("");
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" disabled={creating}>
            Add
          </Button>
        </form>
        <ul className="mt-2 divide-y rounded-md border">
          {categories.length === 0 ? (
            <li className="p-3 text-sm text-muted-foreground">No categories yet.</li>
          ) : (
            categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-2">
                <span className="text-sm">{c.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(c.id)}
                  aria-label={`Delete ${c.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
