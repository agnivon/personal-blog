/**
 * Dynamically resolves the site's base URL using Vercel System Environment Variables,
 * custom environment variables, or local development defaults.
 */
export function getSiteUrl(): string {
  // 1. Explicit site URL override (e.g. custom environment variable)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (siteUrl) {
    return siteUrl.startsWith("http://") || siteUrl.startsWith("https://")
      ? siteUrl
      : `https://${siteUrl}`;
  }

  // 2. Vercel System Environment Variable: Production URL
  const vercelProductionUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) {
    return `https://${vercelProductionUrl}`;
  }

  // 3. Vercel System Environment Variable: Deployment URL (preview / production fallback)
  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  // 4. Local development fallback
  return "http://localhost:3000";
}
