import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "If You Bought BTC Instead",
  description: "See what your past spending would be worth in Bitcoin today"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
