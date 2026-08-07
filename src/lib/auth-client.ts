import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

/**
 * Browser / React auth client.
 * `inferAdditionalFields` makes `useSession().data.user.role` typed.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
