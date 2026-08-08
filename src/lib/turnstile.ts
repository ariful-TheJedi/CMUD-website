/**
 * Cloudflare Turnstile — PAUSED.
 * Do not enable until the user explicitly asks to wire it for production.
 * Forms still send TURNSTILE_BYPASS_TOKEN; server verify is a no-op.
 */

export const TURNSTILE_BYPASS_TOKEN = "localhost-turnstile-bypass";

/** Always false while Turnstile is paused. */
export function isTurnstileEnabledClient(): boolean {
  return false;
}

/** Always false while Turnstile is paused. */
export function isTurnstileEnabledServer(): boolean {
  return false;
}

/** No-op while paused. Re-enable Cloudflare siteverify when Turnstile is turned back on. */
export async function verifyTurnstileToken(_token: string): Promise<void> {
  // PAUSED — intentionally skip Cloudflare verification.
  return;
}
