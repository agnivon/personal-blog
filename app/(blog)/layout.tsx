import "../globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { VisualEditing } from "next-sanity";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { draftMode } from "next/headers";

import AlertBanner from "../../components/alert-banner";
import Header from "../../components/header";

import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { generateSiteMetadata } from "@/config/metadata.config";
import Footer from "../../components/footer";
import { ThemeProvider } from "@/components/providers/theme-provider";

export async function generateMetadata(): Promise<Metadata> {
  return generateSiteMetadata();
}

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serif = Playfair_Display({
  variable: "--font-serif",
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
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider>
          <ConvexClientProvider>
            {isDraftMode && <AlertBanner />}
            <Header />
            <main className="flex-grow py-8 md:py-12">{children}</main>
            <Footer />
            {isDraftMode && <VisualEditing />}
            <SpeedInsights />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
