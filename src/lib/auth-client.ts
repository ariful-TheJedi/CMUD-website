import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

/**
 * Browser / React auth client.
 * baseURL follows the page origin so VPS/LAN hosts work without a VITE_ auth URL.
 */
function clientBaseURL(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

export const authClient = createAuthClient({
  baseURL: clientBaseURL(),
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
