import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Satluj Stones Crushing Mills",
  description:
    "Premium business website and admin dashboard for Satluj Stones Crushing Mills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
