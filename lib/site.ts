/**
 * Canonical production domain configuration.
 */
export const PRODUCTION_DOMAIN = "blog.agnivon.dev";
export const PRODUCTION_URL = `https://${PRODUCTION_DOMAIN}`;

/**
 * Author profile and primary website configuration.
 */
export const AUTHOR_NAME = "Agnivo Neogi";
export const AUTHOR_SITE_DOMAIN = "agnivon.dev";
export const AUTHOR_SITE_URL = `https://${AUTHOR_SITE_DOMAIN}`;

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

  // 2. Vercel System Environment Variable: Preview deployments
  // When running on a Vercel preview deployment, prefer the preview deployment URL
  // so preview assets and visual editing test against the preview URL.
  if (process.env.VERCEL_ENV === "preview") {
    const vercelUrl =
      process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
    if (vercelUrl) {
      return `https://${vercelUrl}`;
    }
  }

  // 3. Vercel System Environment Variable: Production URL
  const vercelProductionUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) {
    return `https://${vercelProductionUrl}`;
  }

  // 4. Production fallback to the configured production domain
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return PRODUCTION_URL;
  }

  // 5. Local development fallback
  return "http://localhost:3000";
}

/**
 * Returns the absolute canonical URL for a given path.
 * Canonical URLs for search engines should ALWAYS point to the production canonical domain
 * (`https://blog.agnivon.dev`), avoiding duplicate content penalties across preview branches.
 */
export function getCanonicalUrl(path = ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // If an explicit override is set (e.g. custom deployment), use that;
  // otherwise default strictly to the production canonical URL.
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
      ? getSiteUrl()
      : PRODUCTION_URL;
  return `${base}${cleanPath === "/" ? "" : cleanPath}`;
}
