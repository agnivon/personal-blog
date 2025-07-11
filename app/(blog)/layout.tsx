import "../globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { VisualEditing } from "next-sanity";
import { Inter } from "next/font/google";
import { draftMode } from "next/headers";

import AlertBanner from "../../components/alert-banner";

import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { generateSiteMetadata } from "@/config/metadata.config";
import Footer from "../../components/footer";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/providers/theme-provider";

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
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="fixed bottom-5 right-5">
            <ModeToggle />
          </div>
          <ConvexClientProvider>
            <section className="min-h-screen">
              {isDraftMode && <AlertBanner />}
              <main>{children}</main>
              <Footer />
            </section>
            {isDraftMode && <VisualEditing />}
            <SpeedInsights />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
