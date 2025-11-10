import type { Metadata, Viewport } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";

// Temporarily disabled Google Fonts due to build environment network restrictions
// Will work fine on Vercel
// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Voxa Auris Dashboard",
  description: "AI voice agent dashboard voor ondernemers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Voxa Auris",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#11b4eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
