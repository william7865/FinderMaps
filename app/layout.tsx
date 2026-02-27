// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestaurantFinder — Discover great places near you",
  description: "Interactive restaurant map powered by OpenStreetMap and Foursquare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-950 text-stone-100 antialiased">{children}</body>
    </html>
  );
}
