import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeTaste — Find your common ground",
  description: "Two tastes. One room. A direction you can agree on.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
