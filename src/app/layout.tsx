import type { Metadata, Viewport } from "next";
import { Andika } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

// Primary-type literacy font — single-storey `a` and `g` so screen letterforms
// match what children handwrite. See docs/non-negotiable-rules.md R1.
const andika = Andika({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-andika",
});

export const metadata: Metadata = {
  title: "WordPets",
  description: "Learn to read with your pet friends!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WordPets",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C3AED",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={andika.variable}>
      <body className={`${andika.className} min-h-screen bg-gradient-to-b from-[#FFF8E1] to-[#FFF0D0] antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
