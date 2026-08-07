/**
 * Cloudflare Turnstile helpers.
 *
 * Paused on local/dev by default. When hosting, set:
 *   VITE_TURNSTILE_ENABLED=true   (client widget)
 *   TURNSTILE_ENABLED=true        (server verify)
 *   TURNSTILE_SECRET_KEY=...      (Cloudflare secret)
 * Or rely on production builds (PROD / NODE_ENV=production) with the secret set.
 */

export const TURNSTILE_BYPASS_TOKEN = "localhost-turnstile-bypass";

/** Client: show/require the Turnstile widget. */
export function isTurnstileEnabledClient(): boolean {
  const flag = import.meta.env.VITE_TURNSTILE_ENABLED;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return Boolean(import.meta.env.PROD);
}

/** Server: verify tokens with Cloudflare siteverify. */
export function isTurnstileEnabledServer(): boolean {
  const flag = process.env.TURNSTILE_ENABLED;
  if (flag === "true") return true;
  if (flag === "false") return false;
  if (process.env.NODE_ENV !== "production") return false;
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstileToken(token: string): Promise<void> {
  if (!isTurnstileEnabledServer()) return;

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY missing");
    throw new Error("Captcha verification unavailable");
  }
  const trimmed = (token ?? "").trim();
  if (trimmed.length < 10) throw new Error("Captcha verification failed");

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", trimmed);
  const captchaRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const captcha = (await captchaRes.json()) as { success?: boolean };
  if (!captcha.success) throw new Error("Captcha verification failed");
}
