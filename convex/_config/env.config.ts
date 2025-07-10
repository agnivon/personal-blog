export const NEXT_PUBLIC_SANITY_PROJECT_ID = process.env
  .NEXT_PUBLIC_SANITY_PROJECT_ID as string;
export const NEXT_PUBLIC_SANITY_DATASET = process.env
  .NEXT_PUBLIC_SANITY_DATASET as string;
export const SANITY_API_READ_TOKEN = process.env
  .SANITY_API_READ_TOKEN as string;
export const SANITY_API_DEVELOPER_TOKEN = process.env
  .SANITY_API_DEVELOPER_TOKEN as string;
export const SANITY_BLOG_AUTHOR_ID = process.env
  .SANITY_BLOG_AUTHOR_ID as string;
export const TIMEZONE = process.env.TIMEZONE || ("Asia/Kolkata" as string);
export const DATE_FORMAT_STRING =
  process.env.DATE_FORMAT_STRING || ("dd/MM/yyyy" as string);
export const CONVEX_DEPLOYMENT = process.env.CONVEX_DEPLOYMENT as string;
export const NEXT_PUBLIC_CONVEX_URL = process.env
  .NEXT_PUBLIC_CONVEX_URL as string;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
export const CONVEX_ENV = process.env.CONVEX_ENV || "development";
