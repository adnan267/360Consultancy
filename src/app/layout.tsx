import "@fontsource-variable/plus-jakarta-sans";
import "flag-icons/css/flag-icons.min.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/env";
import { getSiteSettings } from "@/lib/settings";
import { site } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

export async function generateMetadata(): Promise<Metadata> {
  const { seo_title, seo_description } = await getSiteSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: seo_title, template: `%s | ${site.name}` },
    description: seo_description,
    applicationName: site.name,
    openGraph: {
      type: "website",
      siteName: site.name,
      title: seo_title,
      description: seo_description,
      url: siteUrl(),
      images: [{ url: "/brand/logo-full.png", width: 1400, height: 726, alt: `${site.name} logo` }],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
    ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } } : {}),
  };
}

export const viewport: Viewport = { themeColor: "#0a1f44", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-950">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
