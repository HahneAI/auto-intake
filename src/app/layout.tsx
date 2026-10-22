import type { Metadata, Viewport } from "next";
import { shop } from "@/lib/shop";
import "./globals.css";

export const metadata: Metadata = {
  title: `${shop.name} | Car Trouble Intake`,
  description: shop.tagline,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
