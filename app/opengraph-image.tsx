import { ImageResponse } from "next/og";
import { AUTHOR_NAME, AUTHOR_SITE_DOMAIN } from "@/lib/site";

export const alt = `${AUTHOR_NAME} | Personal Blog & AI Insights`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #27272a 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "80px",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 26,
              borderRadius: "12px",
              width: 52,
              height: 52,
            }}
          >
            AN
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#a1a1aa",
            }}
          >
            blog.agnivon.dev
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#ffffff",
            }}
          >
            {AUTHOR_NAME}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: "#a1a1aa",
              lineHeight: 1.4,
            }}
          >
            Curated articles, news grounding, and AI insights.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #27272a",
            paddingTop: "32px",
            fontSize: 22,
            color: "#71717a",
          }}
        >
          <span>Software Engineering &amp; Artificial Intelligence</span>
          <span>{AUTHOR_SITE_DOMAIN} • blog.agnivon.dev →</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
