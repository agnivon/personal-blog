import "../globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { VisualEditing, toPlainText } from "next-sanity";
import { Inter } from "next/font/google";
import { draftMode } from "next/headers";

import AlertBanner from "../../components/alert-banner";

import * as demo from "@/sanity/lib/demo";
import { sanityFetch } from "@/sanity/lib/fetch";
import { settingsQuery } from "@/sanity/lib/queries";
import { resolveOpenGraphImage } from "@/sanity/lib/utils";
import Footer from "../../components/footer";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { generateSiteMetadata } from "@/config/metadata.config";

export async function generateMetadata(): Promise<Metadata> {
  return generateSiteMetadata();
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <html lang="en" className={`${inter.variable} bg-white text-black`}>
      <body>
        <ConvexClientProvider>
          <section className="min-h-screen">
            {isDraftMode && <AlertBanner />}
            <main>{children}</main>
            <Footer />
          </section>
          {isDraftMode && <VisualEditing />}
          <SpeedInsights />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
