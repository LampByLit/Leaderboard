import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "&amp Leaderboard",
  description: "Track and compare Amazon paperback books by Best Sellers Rank",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
