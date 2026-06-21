import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bair1 — Know Your Air",
  description: "Real-time air quality monitoring. The bear sniffs the air so you don't have to.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Bair1 — Know Your Air",
    description: "Real-time air quality, honestly delivered.",
    url: "https://bair1.live",
    siteName: "Bair1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg text-ink">{children}</body>
    </html>
  );
}
