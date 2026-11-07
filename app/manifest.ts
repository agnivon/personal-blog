import type { MetadataRoute } from "next";
import { AUTHOR_NAME, AUTHOR_SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${AUTHOR_NAME} | Personal Blog & AI Insights`,
    short_name: "Agnivo's Blog",
    description: `Curated articles, news grounding, and AI insights by ${AUTHOR_NAME} (${AUTHOR_SITE_URL}).`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#09090b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
