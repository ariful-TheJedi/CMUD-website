import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { authClient, useSession } from "@/lib/auth-client";
import { getMyAccessStatus } from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerFn } from "@tanstack/react-start";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

const STAFF_ROLES = new Set(["administrator", "staff", "web_manager", "viewer"]);

export const Route = createFileRoute("/admin/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Staff Sign In — CMUD" },
      { name: "description", content: "Sign in to the CMUD admin dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function sanitizeRedirect(value: string | undefined): string {
  if (!value) return "/admin/dashboard";
  if (!value.startsWith("/admin") || value.startsWith("//")) return "/admin/dashboard";
  return value;
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const target = sanitizeRedirect(redirect);
  const { data: session, isPending } = useSession();
  const checkAccess = useServerFn(getMyAccessStatus);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPending) return;
    const role = session?.user?.role;
    if (session?.user && typeof role === "string" && STAFF_ROLES.has(role)) {
      void (async () => {
        try {
          const access = await checkAccess();
          if (access.authenticated && access.allowed) {
            navigate({ to: target, replace: true });
          }
        } catch {
          /* stay on login */
        }
      })();
    }
  }, [session, isPending, navigate, target, checkAccess]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message || "Invalid email or password.");
      return;
    }

    try {
      const access = await checkAccess();
      if (!access.authenticated || !access.allowed) {
        await authClient.signOut();
        setLoading(false);
        if (access.authenticated && access.status === "suspended") {
          toast.error("This account was deleted. Contact an administrator to restore access.");
        } else if (access.authenticated && access.status === "inactive") {
          toast.error("This account is inactive. Contact an administrator.");
        } else {
          toast.error("Your account is not authorized for admin access.");
        }
        return;
      }
    } catch {
      await authClient.signOut();
      setLoading(false);
      toast.error("Could not verify account status. Try again.");
      return;
    }

    setLoading(false);
    navigate({ to: target, replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>CMUD / MedLearn Hub</CardTitle>
          <CardDescription>
            Staff sign in. Local admin: <code className="text-xs">admin@local.dev</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@local.dev"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Forgot password? Ask an administrator to set a new one from Users.
            </p>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              Back to CMUD website
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
