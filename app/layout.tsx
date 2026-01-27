import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Computer Games",
  description: "Family Computer Games",
  keywords: ["fc games", "online game", "Family Computer Games"],
  openGraph: {
    title: "Family Computer Games",
    url: "https://fc-game.github.io",
    siteName: "Family Computer Games",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
