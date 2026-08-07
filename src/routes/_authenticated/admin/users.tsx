import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MoreHorizontal, Plus, RefreshCw, Search, ShieldAlert, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import {
  deleteUser,
  inviteUser,
  listAdminUsers,
  setUserPassword,
  updateUser,
  type AdminUserRow,
  type AppRole,
  type PermissionsMap,
  type UserStatus,
} from "@/lib/admin-users.functions";
import {
  type ContentAccess,
  type ContentSection,
  ASSIGNABLE_SECTIONS,
  SECTION_LABELS,
  emptyPermissions,
} from "@/lib/content-access.shared";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [{ title: "Users — CMUD Admin" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: ({ context }) => {
    const info = (context as { currentUser?: { isAdministrator: boolean } }).currentUser;
    if (!info?.isAdministrator) {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: UsersPage,
  errorComponent: () => (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold">Unauthorized</h1>
      <p className="mt-2 text-sm text-muted-foreground">Only Administrators can manage users.</p>
    </div>
  ),
});

const PAGE_SIZE = 10;

function initials(name: string | null, email: string | null) {
  const src = (name?.trim() || email?.trim() || "?").toUpperCase();
  const parts = src.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}

function formatLastLogin(iso: string | null) {
  if (!iso) return "Never logged in";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `Today, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

function RoleBadge({ role, roleLabel }: { role: AppRole | null; roleLabel: string }) {
  if (role === "administrator")
    return <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Administrator</Badge>;
  return <Badge variant="secondary">{roleLabel || "Staff"}</Badge>;
}

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "active")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15">
        Active
      </Badge>
    );
  if (status === "suspended") return <Badge variant="outline">Suspended</Badge>;
  return <Badge variant="outline">Inactive</Badge>;
}

function PermissionsMatrix({
  value,
  onChange,
  disabled,
}: {
  value: PermissionsMap;
  onChange: (next: PermissionsMap) => void;
  disabled?: boolean;
}) {
  const setOne = (section: ContentSection, access: ContentAccess) => {
    onChange({ ...value, [section]: access });
  };

  return (
    <div className="max-h-64 overflow-y-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Content</th>
            <th className="px-2 py-2 font-medium">None</th>
            <th className="px-2 py-2 font-medium">View</th>
            <th className="px-2 py-2 font-medium">Update</th>
          </tr>
        </thead>
        <tbody>
          {ASSIGNABLE_SECTIONS.map((section) => (
            <tr key={section} className="border-t">
              <td className="px-3 py-1.5">{SECTION_LABELS[section]}</td>
              {(["none", "view", "update"] as ContentAccess[]).map((access) => (
                <td key={access} className="px-2 py-1.5">
                  <input
                    type="radio"
                    name={`perm-${section}`}
                    className="h-4 w-4"
                    checked={value[section] === access}
                    disabled={disabled}
                    onChange={() => setOne(section, access)}
                    aria-label={`${SECTION_LABELS[section]} ${access}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();

  const fetchList = useServerFn(listAdminUsers);
  const invite = useServerFn(inviteUser);
  const update = useServerFn(updateUser);
  const removeUser = useServerFn(deleteUser);
  const setPasswordFn = useServerFn(setUserPassword);

  const query = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchList({}),
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole | "none">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [passwordUser, setPasswordUser] = useState<AdminUserRow | null>(null);
  const [confirm, setConfirm] = useState<{
    user: AdminUserRow;
    action: "activate" | "delete" | "deactivate";
  } | null>(null);

  const filtered = useMemo(() => {
    const list = query.data ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      if (q && !`${u.fullName ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q)) return false;
      if (roleFilter === "none" && u.role !== null) return false;
      if (roleFilter !== "all" && roleFilter !== "none" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [query.data, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const inviteMut = useMutation({
    mutationFn: (data: {
      email: string;
      fullName: string;
      role: AppRole;
      roleLabel: string;
      status: UserStatus;
      password: string;
      permissions: PermissionsMap;
    }) => invite({ data }),
    onSuccess: () => {
      toast.success("User created");
      setAddOpen(false);
      invalidate();
      // Ensure we did not pick up another session; keep admin identity fresh.
      qc.invalidateQueries({ queryKey: ["current-user"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (data: {
      id: string;
      fullName?: string;
      status?: UserStatus;
      role?: AppRole;
      roleLabel?: string;
      permissions?: PermissionsMap;
    }) => update({ data }),
    onSuccess: () => {
      toast.success("User updated");
      setEditUser(null);
      setConfirm(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => removeUser({ data: { id } }),
    onSuccess: () => {
      toast.success("User deleted");
      setConfirm(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordMut = useMutation({
    mutationFn: (data: { id: string; password: string }) => setPasswordFn({ data }),
    onSuccess: () => {
      toast.success("Password updated");
      setPasswordUser(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Assign per-section View or Update access when adding staff. Users management stays
            Administrator-only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add user
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v as typeof roleFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
                <SelectItem value="staff">Custom roles</SelectItem>
                <SelectItem value="none">No role</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as typeof statusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : query.isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-sm text-muted-foreground">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                        Failed to load users. {(query.error as Error)?.message}
                        <Button size="sm" variant="outline" onClick={() => query.refetch()}>
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-sm text-muted-foreground">
                        <UserPlus className="h-6 w-6" />
                        No users match your filters.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{initials(u.fullName, u.email)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {u.fullName || "—"}
                              {u.id === me?.userId ? (
                                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Created {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.email ?? "—"}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} roleLabel={u.roleLabel} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.permissionsSummary}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastLogin(u.lastLoginAt)}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          user={u}
                          isSelf={u.id === me?.userId}
                          onEdit={() => setEditUser(u)}
                          onConfirmStatus={(action) => setConfirm({ user: u, action })}
                          onSetPassword={() => setPasswordUser(u)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > PAGE_SIZE ? (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <div className="text-muted-foreground">
                Page {pageSafe} of {totalPages} · {filtered.length} users
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <UserFormDialog
        mode="add"
        open={addOpen}
        onOpenChange={setAddOpen}
        submitting={inviteMut.isPending}
        onSubmit={(v) => inviteMut.mutate(v)}
      />

      <UserFormDialog
        mode="edit"
        open={!!editUser}
        user={editUser}
        isSelf={editUser?.id === me?.userId}
        onOpenChange={(o) => !o && setEditUser(null)}
        submitting={updateMut.isPending}
        onSubmit={(v) =>
          updateMut.mutate({
            id: editUser!.id,
            fullName: v.fullName,
            role: v.role,
            roleLabel: v.roleLabel,
            status: v.status,
            permissions: v.permissions,
          })
        }
      />

      <SetPasswordDialog
        user={passwordUser}
        onOpenChange={(o) => !o && setPasswordUser(null)}
        submitting={passwordMut.isPending}
        onSubmit={(password) =>
          passwordUser && passwordMut.mutate({ id: passwordUser.id, password })
        }
      />

      <ConfirmDialog
        payload={confirm}
        onCancel={() => setConfirm(null)}
        submitting={updateMut.isPending || deleteMut.isPending}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.action === "delete") {
            deleteMut.mutate(confirm.user.id);
          } else if (confirm.action === "activate") {
            updateMut.mutate({ id: confirm.user.id, status: "active" });
          } else {
            updateMut.mutate({ id: confirm.user.id, status: "inactive" });
          }
        }}
      />
    </div>
  );
}

function RowActions({
  user,
  isSelf,
  onEdit,
  onConfirmStatus,
  onSetPassword,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  onEdit: () => void;
  onConfirmStatus: (action: "activate" | "delete" | "deactivate") => void;
  onSetPassword: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={onSetPassword}>Set password</DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.status !== "active" ? (
          <DropdownMenuItem onClick={() => onConfirmStatus("activate")}>Activate</DropdownMenuItem>
        ) : null}
        {user.status !== "inactive" ? (
          <DropdownMenuItem disabled={isSelf} onClick={() => onConfirmStatus("deactivate")}>
            Deactivate
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          disabled={isSelf}
          className="text-destructive focus:text-destructive"
          onClick={() => onConfirmStatus("delete")}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserFormDialog({
  mode,
  open,
  user,
  isSelf,
  onOpenChange,
  submitting,
  onSubmit,
}: {
  mode: "add" | "edit";
  open: boolean;
  user?: AdminUserRow | null;
  isSelf?: boolean;
  onOpenChange: (o: boolean) => void;
  submitting: boolean;
  onSubmit: (v: {
    fullName: string;
    email: string;
    role: AppRole;
    roleLabel: string;
    status: UserStatus;
    password: string;
    permissions: PermissionsMap;
  }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("staff");
  const [roleLabel, setRoleLabel] = useState("");
  const [status, setStatus] = useState<UserStatus>("active");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [permissions, setPermissions] = useState<PermissionsMap>(emptyPermissions());

  useEffect(() => {
    if (mode === "edit" && user) {
      setFullName(user.fullName ?? "");
      setEmail(user.email ?? "");
      setRole(user.role ?? "staff");
      setRoleLabel(user.role === "administrator" ? "" : user.roleLabel || "");
      setStatus(user.status);
      setPassword("");
      setConfirmPassword("");
      setPermissions({ ...emptyPermissions(), ...user.permissions });
    }
    if (mode === "add" && open) {
      setFullName("");
      setEmail("");
      setRole("staff");
      setRoleLabel("");
      setStatus("active");
      setPassword("");
      setConfirmPassword("");
      setPermissions(emptyPermissions());
    }
  }, [mode, user, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add user" : "Edit user"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a staff account with a password, custom role name, and content access."
              : user?.email}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "add") {
              if (password !== confirmPassword) {
                toast.error("Passwords do not match");
                return;
              }
              if (password.trim().length < 8) {
                toast.error("Password must be at least 8 characters");
                return;
              }
            }
            onSubmit({
              fullName,
              email,
              role,
              roleLabel,
              status,
              password: mode === "add" ? password : "",
              permissions,
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="user-name">Full name</Label>
            <Input
              id="user-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          {mode === "add" ? (
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : null}
          {mode === "add" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password-confirm">Confirm password</Label>
                <Input
                  id="user-password-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              To change this user’s password, use Actions → Set password.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Access type</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as AppRole)}
                disabled={!!isSelf && role === "administrator"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff" disabled={!!isSelf}>
                    Custom role
                  </SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {isSelf ? (
                <p className="text-[11px] text-muted-foreground">You cannot demote yourself.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as UserStatus)}
                disabled={!!isSelf}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive" disabled={!!isSelf}>
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {role === "staff" ? (
            <div className="space-y-2">
              <Label htmlFor="role-label">Role name</Label>
              <Input
                id="role-label"
                required
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
                placeholder="e.g. Gallery Editor, Content Manager"
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">
                Custom label shown in the admin panel. Access is controlled by the matrix below.
              </p>
            </div>
          ) : null}

          {role === "administrator" ? (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Administrators have full access to all content, including Users and Settings.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Content access</Label>
              <p className="text-xs text-muted-foreground">
                View = read only. Update = create, edit, publish, and delete for that section. Users
                &amp; Settings cannot be granted.
              </p>
              <PermissionsMatrix value={permissions} onChange={setPermissions} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !fullName.trim() ||
                (mode === "add" && !email.trim()) ||
                (mode === "add" && password.trim().length < 8) ||
                (role === "staff" && !roleLabel.trim())
              }
            >
              {submitting
                ? mode === "add"
                  ? "Creating…"
                  : "Saving…"
                : mode === "add"
                  ? "Create user"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SetPasswordDialog({
  user,
  onOpenChange,
  submitting,
  onSubmit,
}: {
  user: AdminUserRow | null;
  onOpenChange: (o: boolean) => void;
  submitting: boolean;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setPassword("");
      setConfirmPassword("");
    }
  }, [user]);

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set password</DialogTitle>
          <DialogDescription>
            Set a new login password for {user?.fullName || user?.email}. Email recovery will be
            added later.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (password !== confirmPassword) {
              toast.error("Passwords do not match");
              return;
            }
            if (password.trim().length < 8) {
              toast.error("Password must be at least 8 characters");
              return;
            }
            onSubmit(password);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="set-password">New password</Label>
            <Input
              id="set-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-password-confirm">Confirm password</Label>
            <Input
              id="set-password-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || password.trim().length < 8}>
              {submitting ? "Saving…" : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({
  payload,
  onCancel,
  onConfirm,
  submitting,
}: {
  payload: {
    user: AdminUserRow;
    action: "activate" | "delete" | "deactivate";
  } | null;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  if (!payload) return null;
  const { user, action } = payload;
  const isDelete = action === "delete";
  const label =
    action === "activate"
      ? "Activate account"
      : action === "delete"
        ? "Delete user permanently"
        : "Deactivate account";
  const consequence =
    action === "activate"
      ? "The user will be able to sign in again."
      : action === "delete"
        ? "This permanently removes the account. The email can be used again."
        : "The user will be signed out and blocked from the admin dashboard.";
  return (
    <AlertDialog open onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block font-medium text-foreground">{user.fullName || user.email}</span>
            <span className="block text-xs text-muted-foreground">{user.email}</span>
            <span className="mt-2 block">{consequence}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            onClick={onConfirm}
            className={
              isDelete ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined
            }
          >
            {submitting ? "Working…" : isDelete ? "Delete" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
