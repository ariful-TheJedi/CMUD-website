/**
 * Cloudflare Turnstile helpers.
 *
 * Enable on the host with:
 *   VITE_TURNSTILE_ENABLED=true   (client widget — rebuild required)
 *   TURNSTILE_ENABLED=true        (server verify)
 *   TURNSTILE_SECRET_KEY=...      (from Cloudflare Turnstile dashboard)
 *
 * When disabled, forms use TURNSTILE_BYPASS_TOKEN and server verify is skipped.
 */

export const TURNSTILE_BYPASS_TOKEN = "localhost-turnstile-bypass";

function envFlagTrue(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "true";
}

/** Client: show/require the Turnstile widget. */
export function isTurnstileEnabledClient(): boolean {
  return envFlagTrue(import.meta.env.VITE_TURNSTILE_ENABLED as string | undefined);
}

/** Server: verify tokens with Cloudflare siteverify. */
export function isTurnstileEnabledServer(): boolean {
  return (
    envFlagTrue(process.env.TURNSTILE_ENABLED) &&
    Boolean(process.env.TURNSTILE_SECRET_KEY?.trim())
  );
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
  if (trimmed === TURNSTILE_BYPASS_TOKEN) {
    throw new Error("Captcha verification failed");
  }

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
