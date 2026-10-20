import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "360 Consultancy | Online Visa Guidance",
  description: "Book an online visa guidance consultation with 360 Consultancy.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://360consultancy.pk")
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}