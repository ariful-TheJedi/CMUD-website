import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

/** Public session helper for route beforeLoad (cookies → Better Auth). */
export const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  return auth.api.getSession({ headers });
});
