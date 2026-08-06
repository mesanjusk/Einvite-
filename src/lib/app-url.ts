/**
 * Resolves the app's public base URL without requiring NEXT_PUBLIC_APP_URL
 * to be set by hand. Vercel injects VERCEL_PROJECT_PRODUCTION_URL (the
 * stable production domain) and VERCEL_URL (the current deployment's own
 * URL, which changes every deploy) automatically — no dashboard config
 * needed. NEXT_PUBLIC_APP_URL still wins when set, e.g. to point at a
 * custom domain.
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
